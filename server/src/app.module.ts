import { BoardsModule } from "./boards/boards.module";
import { Module } from "@nestjs/common";
import { IssuesModule } from "./issues/issues.module";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BoardsModule,
    IssuesModule,
  ],
})
export class AppModule {}
