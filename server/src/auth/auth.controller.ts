import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private service: AuthService) {}

  @Post("register")
  register(
    @Body() body: { email: string; name: string; password: string },
  ) {
    return this.service.register(body);
  }

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.service.login(body);
  }
}
