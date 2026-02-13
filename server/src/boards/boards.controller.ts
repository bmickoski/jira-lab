import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { BoardsService } from "./boards.service";

@Controller("boards")
export class BoardsController {
  constructor(private service: BoardsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.service.create(body.name);
  }

  @Get(":boardId/sprints")
  listSprints(@Param("boardId") boardId: string) {
    return this.service.listSprints(boardId);
  }

  @Post(":boardId/sprints")
  createSprint(
    @Param("boardId") boardId: string,
    @Body() body: { name: string; isActive?: boolean },
  ) {
    return this.service.createSprint(boardId, body);
  }

  @Patch(":boardId/active-sprint")
  setActiveSprint(
    @Param("boardId") boardId: string,
    @Body() body: { sprintId: string },
  ) {
    return this.service.setActiveSprint(boardId, body.sprintId);
  }

  @Patch(":boardId/issues/:id/move")
  moveIssue(
    @Param("boardId") boardId: string,
    @Param("id") id: string,
    @Body()
    body: {
      sprintId: string | null;
      // optional overrides (nice for later)
      status?: string;
      order?: number;
    },
  ) {
    return this.service.moveIssue(boardId, id, body);
  }
}
