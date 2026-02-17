import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(input: { email: string; name: string; password: string }, metadata?: { userAgent?: string; ipAddress?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const hashed = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: hashed,
      },
    });

    const tokens = await this.generateTokenPair(user.id, user.email, metadata);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async login(input: { email: string; password: string }, metadata?: { userAgent?: string; ipAddress?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokenPair(user.id, user.email, metadata);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // Token Generation
  async generateTokenPair(userId: string, email: string, metadata?: { userAgent?: string; ipAddress?: string }) {
    const familyId = crypto.randomUUID();
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = await this.generateRefreshToken(userId, email, familyId, metadata);

    return { accessToken, refreshToken };
  }

  generateAccessToken(userId: string, email: string): string {
    return this.jwt.sign({ sub: userId, email });
  }

  async generateRefreshToken(userId: string, email: string, familyId: string, metadata?: { userAgent?: string; ipAddress?: string }): Promise<string> {
    const refreshSecret = this.config.get<string>("JWT_REFRESH_SECRET");
    const token = crypto.randomBytes(64).toString("hex");

    // Create JWT with familyId for validation
    const jwtPayload = { sub: userId, email, familyId, type: "refresh" };
    const jwtToken = this.jwt.sign(jwtPayload, {
      secret: refreshSecret,
      expiresIn: "30d",
    });

    // Store hashed token in database
    const tokenHash = this.hashToken(jwtToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.storeRefreshToken(userId, tokenHash, familyId, expiresAt, metadata);

    return jwtToken;
  }

  // Token Storage
  async storeRefreshToken(
    userId: string,
    tokenHash: string,
    familyId: string,
    expiresAt: Date,
    metadata?: { userAgent?: string; ipAddress?: string }
  ) {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      },
    });
  }

  // Token Rotation
  async rotateRefreshToken(oldToken: string, metadata?: { userAgent?: string; ipAddress?: string }) {
    // Validate the old token
    const payload = await this.validateRefreshToken(oldToken);

    // Check for token reuse (security)
    const tokenHash = this.hashToken(oldToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.isRevoked) {
      // Token reuse detected - revoke entire family
      if (storedToken) {
        await this.detectTokenReuse(storedToken.familyId);
      }
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Mark old token as revoked
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { isRevoked: true, lastUsedAt: new Date() },
    });

    // Generate new token pair
    const newFamilyId = crypto.randomUUID();
    const accessToken = this.generateAccessToken(payload.sub, payload.email);
    const refreshToken = await this.generateRefreshToken(payload.sub, payload.email, newFamilyId, metadata);

    // Link old token to new token
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { replacedBy: this.hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  // Token Validation
  async validateRefreshToken(token: string): Promise<{ sub: string; email: string; familyId: string }> {
    try {
      const refreshSecret = this.config.get<string>("JWT_REFRESH_SECRET");
      const payload = this.jwt.verify(token, { secret: refreshSecret });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }

      const tokenHash = this.hashToken(token);
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException("Token expired or revoked");
      }

      return { sub: payload.sub, email: payload.email, familyId: payload.familyId };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  // Token Revocation
  async revokeRefreshToken(tokenHash: string) {
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  async revokeUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  // Security: Token Reuse Detection
  async detectTokenReuse(familyId: string): Promise<boolean> {
    // Revoke all tokens in this family
    await this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
    return true;
  }

  // Cleanup
  async cleanupExpiredTokens() {
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
          },
        ],
      },
    });
    return deleted.count;
  }

  // Helper
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
