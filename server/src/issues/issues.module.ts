import { Module } from "@nestjs/common";
import { IssuesController } from "./issues.controller";
import { IssuesService } from "./issues.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [IssuesController],
  providers: [IssuesService],
  imports: [PrismaModule],
})
export class IssuesModule {}
