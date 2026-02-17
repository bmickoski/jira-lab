import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IssuesService } from "./issues.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ZodValidationPipe } from "nestjs-zod";
import {
  CreateIssueInputSchema,
  PatchIssueInputSchema,
  BatchPatchInputSchema,
  ListIssuesInputSchema,
  type CreateIssueInput,
  type PatchIssueInput,
  type BatchPatchInput,
  type ListIssuesInput,
} from "@jira-lab/shared";

@Controller("issues")
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private service: IssuesService) {}

  @Get()
  list(
    @Req() req: any,
    @Query(new ZodValidationPipe(ListIssuesInputSchema))
    query: ListIssuesInput
  ) {
    return this.service.list(
      { boardId: query.boardId, sprintId: query.sprintId ?? null },
      req.user.id
    );
  }

  @Post()
  create(
    @Req() req: any,
    @Body(new ZodValidationPipe(CreateIssueInputSchema)) body: CreateIssueInput
  ) {
    return this.service.create(body, req.user.id);
  }

  @Patch("batch")
  batchPatch(
    @Req() req: any,
    @Body(new ZodValidationPipe(BatchPatchInputSchema)) body: BatchPatchInput
  ) {
    return this.service.batchPatch(body, req.user.id);
  }

  @Patch(":id")
  patch(
    @Req() req: any,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(PatchIssueInputSchema)) body: PatchIssueInput
  ) {
    return this.service.patch(id, body.patch, req.user.id);
  }
}
