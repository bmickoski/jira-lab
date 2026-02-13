import { Module } from "@nestjs/common";
import { BoardsController } from "./boards.controller";
import { BoardsService } from "./boards.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [BoardsController],
  providers: [BoardsService],
  imports: [PrismaModule],
})
export class BoardsModule {}
