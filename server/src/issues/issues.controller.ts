import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IssuesService } from "./issues.service";
import { IssueStatus } from "../../generated/prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("issues")
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private service: IssuesService) {}

  @Get()
  list(
    @Req() req: any,
    @Query("boardId") boardId: string,
    @Query("sprintId") sprintId?: string,
  ) {
    return this.service.list(
      { boardId, sprintId: sprintId ?? null },
      req.user.id,
    );
  }

  @Post()
  create(
    @Req() req: any,
    @Body()
    body: {
      boardId: string;
      sprintId: string | null;
      title: string;
      description?: string;
      status: IssueStatus;
      order: number;
      assigneeId?: string | number | null;
      watcherIds?: Array<string | number>;
    },
  ) {
    return this.service.create(body, req.user.id);
  }

  @Patch("batch")
  batchPatch(@Req() req: any, @Body() body: Array<{ id: string; patch: any }>) {
    return this.service.batchPatch(body, req.user.id);
  }

  @Patch(":id")
  patch(@Req() req: any, @Param("id") id: string, @Body() patch: any) {
    return this.service.patch(id, patch, req.user.id);
  }
}
