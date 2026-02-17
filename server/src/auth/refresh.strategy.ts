import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from "passport-jwt";
import { Request } from "express";
import { AuthService } from "./auth.service";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request.cookies?.refresh_token;
        },
      ]),
      secretOrKey: config.get<string>("JWT_REFRESH_SECRET"),
      passReqToCallback: true,
      ignoreExpiration: false,
    } as StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: { sub: string; email: string; familyId: string; type: string }) {
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }

    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token");
    }

    // Validate token exists in database and is not revoked
    try {
      await this.authService.validateRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return {
      id: payload.sub,
      email: payload.email,
      familyId: payload.familyId,
      token: refreshToken,
    };
  }
}
