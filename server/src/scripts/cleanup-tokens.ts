#!/usr/bin/env node
/**
 * Token Cleanup Script
 *
 * This script removes expired and old revoked refresh tokens from the database.
 * It should be run periodically (e.g., daily via cron) to keep the database clean.
 *
 * Usage:
 *   npm run cleanup-tokens
 *   or
 *   node dist/scripts/cleanup-tokens.js
 */

import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

async function cleanupTokens() {
  try {
    console.log("Starting token cleanup...");

    // Delete tokens that meet any of these criteria:
    // 1. Expired tokens (expiresAt < now)
    // 2. Revoked tokens older than 90 days (for audit trail)
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });

    console.log(`✅ Cleaned up ${result.count} expired/old refresh tokens`);

    // Get stats about remaining tokens
    const stats = await prisma.refreshToken.groupBy({
      by: ["isRevoked"],
      _count: true,
    });

    console.log("\n📊 Remaining tokens:");
    stats.forEach((stat) => {
      const status = stat.isRevoked ? "Revoked" : "Active";
      console.log(`  ${status}: ${stat._count}`);
    });

    return result.count;
  } catch (error) {
    console.error("❌ Error during token cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  cleanupTokens()
    .then((count) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { cleanupTokens };
