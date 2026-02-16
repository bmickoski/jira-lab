import { BoardsModule } from "./boards/boards.module";
import { Module } from "@nestjs/common";
import { IssuesModule } from "./issues/issues.module";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BoardsModule,
    IssuesModule,
  ],
})
export class AppModule {}
