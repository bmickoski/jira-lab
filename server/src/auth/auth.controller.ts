import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "nestjs-zod";
import {
  LoginInputSchema,
  RegisterInputSchema,
  type LoginInput,
  type RegisterInput,
} from "@jira-lab/shared";

@Controller("auth")
export class AuthController {
  constructor(private service: AuthService) {}

  @Post("register")
  register(@Body(new ZodValidationPipe(RegisterInputSchema)) body: RegisterInput) {
    return this.service.register(body);
  }

  @Post("login")
  login(@Body(new ZodValidationPipe(LoginInputSchema)) body: LoginInput) {
    return this.service.login(body);
  }
}
