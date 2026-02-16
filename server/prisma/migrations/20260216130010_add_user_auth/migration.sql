-- CreateTable (User must exist before we reference it)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable: add userId as nullable first
ALTER TABLE "Board" ADD COLUMN "userId" TEXT;

-- Backfill: create a default user and assign all existing boards to it
INSERT INTO "User" ("id", "email", "password", "name", "createdAt")
VALUES ('default-user', 'demo@jiralab.dev', '$2b$10$placeholder', 'Demo User', NOW())
ON CONFLICT ("email") DO NOTHING;

UPDATE "Board" SET "userId" = (SELECT "id" FROM "User" WHERE "email" = 'demo@jiralab.dev' LIMIT 1) WHERE "userId" IS NULL;

-- Now make it required
ALTER TABLE "Board" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
