import { Body, Controller, Post, Res, Req, UseGuards } from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RefreshGuard } from "./refresh.guard";
import { ZodValidationPipe } from "nestjs-zod";
import {
  LoginInputSchema,
  RegisterInputSchema,
  type LoginInput,
  type RegisterInput,
} from "@jira-lab/shared";

// Extend Express Request to include user
interface RequestWithUser extends Request {
  user: { id: string; email: string; familyId?: string; token?: string };
}

@Controller("auth")
export class AuthController {
  constructor(private service: AuthService) {}

  @Post("register")
  async register(
    @Body(new ZodValidationPipe(RegisterInputSchema)) body: RegisterInput,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const metadata = {
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    };

    const result = await this.service.register(body, metadata);

    // Set refresh token as httpOnly cookie
    response.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/auth/refresh",
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("login")
  async login(
    @Body(new ZodValidationPipe(LoginInputSchema)) body: LoginInput,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const metadata = {
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    };

    const result = await this.service.login(body, metadata);

    // Set refresh token as httpOnly cookie
    response.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/auth/refresh",
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("refresh")
  @UseGuards(RefreshGuard)
  async refresh(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const metadata = {
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    };

    // Rotate the refresh token
    const result = await this.service.rotateRefreshToken(request.user.token!, metadata);

    // Set new refresh token cookie
    response.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/auth/refresh",
    });

    return {
      accessToken: result.accessToken,
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Revoke user's refresh tokens
    await this.service.revokeUserTokens(request.user.id);

    // Clear cookie
    response.clearCookie("refresh_token", { path: "/auth/refresh" });

    return { message: "Logged out successfully" };
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Revoke all tokens across all devices
    await this.service.revokeUserTokens(request.user.id);

    // Clear cookie
    response.clearCookie("refresh_token", { path: "/auth/refresh" });

    return { message: "Logged out from all devices" };
  }
}
