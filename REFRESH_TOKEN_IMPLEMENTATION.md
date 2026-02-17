# Refresh Token Implementation Guide

## Overview

This application implements production-grade JWT authentication with automatic token refresh and rotation. The implementation follows security best practices including:

- ✅ **Short-lived access tokens** (15 minutes)
- ✅ **Long-lived refresh tokens** (30 days) stored as httpOnly cookies
- ✅ **Token rotation** - New refresh token issued on each use
- ✅ **Token reuse detection** - Automatic revocation of token families on suspicious activity
- ✅ **Automatic retry on 401** - Seamless user experience with transparent token refresh
- ✅ **Silent background refresh** - Tokens refreshed before expiration

## Architecture

### Backend (NestJS)

#### Token Strategy

1. **Access Token (JWT)**
   - Lifetime: 15 minutes
   - Stored: Client-side (memory only)
   - Contains: userId, email
   - Used for: API authorization via Bearer header

2. **Refresh Token (JWT + Database)**
   - Lifetime: 30 days
   - Stored: httpOnly cookie + database (hashed)
   - Contains: userId, email, familyId, type
   - Used for: Generating new access tokens

#### Database Schema

```prisma
model RefreshToken {
  id           String   @id @default(cuid())
  userId       String
  tokenHash    String   @unique
  familyId     String   // For token reuse detection
  expiresAt    DateTime
  isRevoked    Boolean  @default(false)
  replacedBy   String?  // Links to next token in rotation
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())
  userAgent    String?  // Device tracking
  ipAddress    String?  // Security audit

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create account + issue tokens |
| `/auth/login` | POST | Authenticate + issue tokens |
| `/auth/refresh` | POST | Rotate tokens (requires refresh cookie) |
| `/auth/logout` | POST | Revoke current device tokens |
| `/auth/logout-all` | POST | Revoke all user tokens (all devices) |

### Frontend (React + Zustand)

#### Token Management

**Store: `authStore.ts`**
- Manages access token in memory
- Handles token refresh with deduplication
- Automatic logout on refresh failure

**Hook: `useTokenRefresh.ts`**
- Runs on app mount and every 14 minutes
- Proactively refreshes before 15-minute expiration
- Silent failures (retry on next API call)

**HTTP Client: `jira.client.ts`**
- Intercepts 401 responses
- Automatically retries with fresh token
- Prevents infinite retry loops
- Redirects to login if refresh fails

## Environment Variables

### Required Variables

Add these to your `server/.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# JWT Secrets (generate using: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars-different-from-access"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

### Generating Secure Secrets

```bash
# Generate access secret
openssl rand -base64 32

# Generate refresh secret (must be different!)
openssl rand -base64 32
```

## Security Features

### 1. Token Rotation
Every refresh generates a new token pair, invalidating the old refresh token:
```
Login → Token A → Refresh → Token B (A revoked) → Refresh → Token C (B revoked)
```

### 2. Token Reuse Detection
If an old token is used after rotation:
1. System detects reuse (revoked token being used)
2. Entire token family is revoked
3. User must re-authenticate

This protects against token theft scenarios.

### 3. Token Storage Security
- Access tokens: **Memory only** (lost on page reload)
- Refresh tokens: **httpOnly cookies** (not accessible to JavaScript)
- Database: **SHA-256 hashed** (even DB access doesn't expose tokens)

### 4. Automatic Cleanup
Old tokens are cleaned up automatically:

```bash
# Run manually
npm run cleanup-tokens

# Or set up cron (Linux/Mac)
0 2 * * * cd /path/to/server && npm run cleanup-tokens
```

Cleanup removes:
- Expired tokens (expiresAt < now)
- Revoked tokens older than 90 days

## Usage Examples

### Frontend: Login
```typescript
import { authClient } from "@/features/auth/auth.client";
import { useAuthStore } from "@/features/auth/authStore";

const { accessToken, user } = await authClient.login({ email, password });
useAuthStore.getState().setAuth(accessToken, user);
```

### Frontend: Automatic Refresh
```typescript
// In your root App component
import { useTokenRefresh } from "@/features/auth/useTokenRefresh";

function App() {
  useTokenRefresh(); // Handles everything automatically
  return <Routes />;
}
```

### Backend: Protected Route
```typescript
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Get("protected")
getProtected(@Req() req) {
  // req.user = { id, email }
  return { data: "secret" };
}
```

### Backend: Manual Token Refresh
```typescript
const result = await authService.rotateRefreshToken(oldToken, metadata);
// result = { accessToken, refreshToken }
```

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Register new account
- [ ] Access protected routes
- [ ] Wait 15+ minutes, verify automatic refresh
- [ ] Logout and verify cookie cleared
- [ ] Try using old refresh token after rotation (should fail)
- [ ] Close browser, reopen (should refresh on first API call)
- [ ] Login from multiple devices, logout-all, verify all sessions end

## Monitoring & Maintenance

### Database Queries

**Check active tokens by user:**
```sql
SELECT COUNT(*) as token_count, "userId"
FROM "RefreshToken"
WHERE "isRevoked" = false AND "expiresAt" > NOW()
GROUP BY "userId";
```

**Find suspicious token activity:**
```sql
SELECT "userId", "userAgent", "ipAddress", COUNT(*) as attempts
FROM "RefreshToken"
WHERE "isRevoked" = true AND "createdAt" > NOW() - INTERVAL '1 day'
GROUP BY "userId", "userAgent", "ipAddress"
HAVING COUNT(*) > 10;
```

### Performance

- Tokens are indexed by `userId`, `familyId`, `expiresAt`, and `userId + isRevoked`
- Cleanup script should run daily to prevent table bloat
- Average token size: ~1KB per entry

## Troubleshooting

### Issue: "Token expired" immediately after login
- **Cause:** Server time mismatch
- **Fix:** Ensure server time is synced (NTP)

### Issue: Infinite redirect to login
- **Cause:** Refresh endpoint failing silently
- **Fix:** Check browser console, verify `JWT_REFRESH_SECRET` is set

### Issue: "Invalid refresh token" on every request
- **Cause:** Cookie not being sent
- **Fix:**
  - Verify `credentials: "include"` in fetch calls
  - Check CORS settings allow credentials
  - Ensure frontend/backend URLs match CORS config

### Issue: Tokens not cleaning up
- **Cause:** Cleanup script not running
- **Fix:** Set up cron job or run manually: `npm run cleanup-tokens`

## Production Deployment

### Checklist

- [ ] Generate strong random secrets (min 32 chars)
- [ ] Set `NODE_ENV=production` (enables secure cookies)
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set correct `FRONTEND_URL` in CORS config
- [ ] Set up daily cleanup cron job
- [ ] Enable database backups
- [ ] Monitor token table size
- [ ] Set up rate limiting on auth endpoints
- [ ] Consider adding Redis for token blacklist (optional)

### Render Deployment

If using Render:
1. Add environment variables in dashboard
2. Cleanup cron: Create separate "Cron Job" service pointing to cleanup script
3. Schedule: `0 2 * * *` (2 AM daily)

## Future Enhancements

- [ ] Rate limiting on `/auth/refresh` endpoint
- [ ] IP-based suspicious activity detection
- [ ] Email notifications on new device login
- [ ] Remember device (longer refresh token for trusted devices)
- [ ] Redis cache for revoked token blacklist
- [ ] Refresh token rotation optional (configurable)
