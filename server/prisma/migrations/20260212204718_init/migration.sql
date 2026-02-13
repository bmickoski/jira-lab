-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('backlog', 'todo', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "sprintId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "IssueStatus" NOT NULL,
    "order" INTEGER NOT NULL,
    "assigneeId" TEXT,
    "watcherIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issue_boardId_sprintId_status_idx" ON "Issue"("boardId", "sprintId", "status");
