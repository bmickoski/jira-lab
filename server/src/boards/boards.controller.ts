import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { BoardsService } from "./boards.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("boards")
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private service: BoardsService) {}

  @Get()
  list(@Req() req: any) {
    return this.service.list(req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() body: { name: string }) {
    return this.service.create(body.name, req.user.id);
  }

  @Get(":boardId/sprints")
  listSprints(@Req() req: any, @Param("boardId") boardId: string) {
    return this.service.listSprints(boardId, req.user.id);
  }

  @Post(":boardId/sprints")
  createSprint(
    @Req() req: any,
    @Param("boardId") boardId: string,
    @Body() body: { name: string; isActive?: boolean },
  ) {
    return this.service.createSprint(boardId, body, req.user.id);
  }

  @Patch(":boardId/active-sprint")
  setActiveSprint(
    @Req() req: any,
    @Param("boardId") boardId: string,
    @Body() body: { sprintId: string },
  ) {
    return this.service.setActiveSprint(boardId, body.sprintId, req.user.id);
  }

  @Patch(":boardId/issues/:id/move")
  moveIssue(
    @Req() req: any,
    @Param("boardId") boardId: string,
    @Param("id") id: string,
    @Body()
    body: {
      sprintId: string | null;
      status?: string;
      order?: number;
    },
  ) {
    return this.service.moveIssue(boardId, id, body, req.user.id);
  }
}
