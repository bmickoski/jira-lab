import "dotenv/config";
import { PrismaClient, IssueStatus } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("render.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function makeIssueKey(boardCode: string, n: number) {
  // ex: CORE-1, CORE-2, PICK-1...
  return `${boardCode}-${n}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // For dev: wipe and recreate (keeps it deterministic)
  await prisma.issue.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  // ----------------------------
  // Demo user
  // ----------------------------
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@jiralab.dev",
      name: "Demo User",
      password: await bcrypt.hash("demo123", 10),
    },
  });
  console.log("Demo user:", { id: demoUser.id, email: demoUser.email });

  // ----------------------------
  // Boards
  // ----------------------------
  const core = await prisma.board.create({
    data: { name: "Core UI", userId: demoUser.id },
  });

  const picker = await prisma.board.create({
    data: { name: "Picker Lab", userId: demoUser.id },
  });

  // ----------------------------
  // Sprints
  // ----------------------------
  // Core UI: one active + one inactive
  const coreSprint1 = await prisma.sprint.create({
    data: {
      boardId: core.id,
      name: "Sprint 1 (active)",
      isActive: true,
    },
  });

  const coreSprint2 = await prisma.sprint.create({
    data: {
      boardId: core.id,
      name: "Sprint 2",
      isActive: false,
    },
  });

  // Picker Lab: one active
  const pickerSprint1 = await prisma.sprint.create({
    data: {
      boardId: picker.id,
      name: "Sprint 1 (active)",
      isActive: true,
    },
  });

  // ----------------------------
  // Issues
  // ----------------------------
  // Core backlog (no sprint)
  await prisma.issue.createMany({
    data: [
      {
        boardId: core.id,
        sprintId: null,
        title: "Setup project",
        description: "Initial project setup",
        status: IssueStatus.backlog,
        order: 1000,
        key: makeIssueKey("CORE", 1),
      },
      {
        boardId: core.id,
        sprintId: null,
        title: "Define domain types",
        description: "Board/Sprint/Issue types + utils",
        status: IssueStatus.backlog,
        order: 2000,
        key: makeIssueKey("CORE", 2),
      },
    ],
  });

  // Core sprint issues
  await prisma.issue.createMany({
    data: [
      {
        boardId: core.id,
        sprintId: coreSprint1.id,
        title: "Build entity picker",
        description: "Core feature",
        status: IssueStatus.todo,
        order: 1000,
        key: makeIssueKey("CORE", 3),
      },
      {
        boardId: core.id,
        sprintId: coreSprint1.id,
        title: "Implement drag & drop",
        description: "DnD support",
        status: IssueStatus.in_progress,
        order: 2000,
        key: makeIssueKey("CORE", 4),
      },
      {
        boardId: core.id,
        sprintId: coreSprint1.id,
        title: "Deploy MVP",
        description: "First release",
        status: IssueStatus.done,
        order: 3000,
        key: makeIssueKey("CORE", 5),
      },
    ],
  });

  // Picker Lab sprint issues
  await prisma.issue.createMany({
    data: [
      {
        boardId: picker.id,
        sprintId: pickerSprint1.id,
        title: "Multi-picker virtualization",
        description: "tanstack/react-virtual improvements",
        status: IssueStatus.todo,
        order: 1000,
        key: makeIssueKey("PICK", 1),
      },
      {
        boardId: picker.id,
        sprintId: pickerSprint1.id,
        title: "Keyboard navigation polish",
        description: "Better a11y and UX",
        status: IssueStatus.todo,
        order: 2000,
        key: makeIssueKey("PICK", 2),
      },
    ],
  });

  console.log("✅ Seeding finished");
  console.log("Boards:", { core: core.id, picker: picker.id });
  console.log("Sprints:", {
    coreSprint1: coreSprint1.id,
    coreSprint2: coreSprint2.id,
    pickerSprint1: pickerSprint1.id,
  });
  console.log("📧 Demo login: demo@jiralab.dev / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
