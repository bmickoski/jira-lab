# Quick Start: Authentication with Refresh Tokens

## 🚀 What's Implemented

**production-grade authentication** with automatic token refresh!

### Features
- ✅ JWT access tokens (15 min) + refresh tokens (30 days)
- ✅ Automatic silent token refresh every 14 minutes
- ✅ Automatic retry on 401 errors
- ✅ Secure httpOnly cookies for refresh tokens
- ✅ Token rotation (new token on each refresh)
- ✅ Token reuse detection (security against theft)
- ✅ Multi-device support with logout/logout-all

## 📝 Environment Setup

Make sure `server/.env` has these variables:

```env
JWT_ACCESS_SECRET="your-secret-here-min-32-chars"
JWT_REFRESH_SECRET="different-secret-min-32-chars"
FRONTEND_URL="http://localhost:5173"
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

## 🧪 Testing the Implementation

### 1. Start the application

**Terminal 1 - Backend:**
```bash
cd server
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 2. Test Login Flow

1. Navigate to `http://localhost:5173/login`
2. Login with demo credentials:
   - Email: `demo@jiralab.dev`
   - Password: `demo123`
3. Check browser DevTools:
   - Application → Cookies → Look for `refresh_token` (httpOnly)
   - Network → Check auth headers on API requests

### 3. Test Automatic Refresh

**Option A: Wait naturally**
1. Stay logged in for 14 minutes
2. Watch Network tab - you'll see `/auth/refresh` called automatically
3. App continues working seamlessly

**Option B: Force test (recommended)**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Note the logged-in state
4. Wait 16 minutes (or manually trigger in code)
5. Make an API call (create board, issue, etc.)
6. Should auto-refresh and work without redirecting to login

### 4. Test Token Rotation

Open DevTools Network tab:
1. Login → Note `refresh_token` cookie value
2. Wait 14 min (or manually refresh) → Check cookie changed
3. Old token is now revoked in database

### 5. Test Logout

```typescript
// Single device logout
await authStore.logout();
// → Revokes current refresh token
// → Clears cookie
// → Redirects to /login

// All devices logout
// Call /auth/logout-all endpoint
// → Revokes ALL user tokens across all devices
```

## 🔍 Debugging

### Check Token in Database

```bash
cd server
npx prisma studio
```

Navigate to `RefreshToken` table and inspect:
- `tokenHash`: SHA-256 hash of the token
- `familyId`: Links related tokens
- `isRevoked`: Should be `false` for active tokens
- `expiresAt`: Should be ~30 days from creation

### Common Issues

**"Session expired" on every request**
- Check: Is `JWT_REFRESH_SECRET` set in `.env`?
- Check: Is the database up and running?
- Check: Are cookies being sent? (verify `credentials: "include"`)

**401 errors not auto-retrying**
- Check: Is `useTokenRefresh()` called in App.tsx?
- Check: Frontend `jira.client.ts` has retry logic

**Tokens not cleaning up**
```bash
cd server
npm run cleanup-tokens
```

## 🛠️ Maintenance

### Daily Cleanup (Optional but Recommended)

**Manual:**
```bash
cd server
npm run cleanup-tokens
```

**Automated (Cron - Linux/Mac):**
```bash
crontab -e
# Add this line (runs at 2 AM daily):
0 2 * * * cd /path/to/jira-lab/server && npm run cleanup-tokens >> /var/log/jira-cleanup.log 2>&1
```

**Automated (Windows Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task → "Cleanup Tokens"
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `npm`
   - Arguments: `run cleanup-tokens`
   - Start in: `C:\path\to\jira-lab\server`

## 📊 Monitoring

### Check Active Sessions

```sql
-- Count active tokens per user
SELECT u.email, COUNT(*) as active_sessions
FROM "RefreshToken" rt
JOIN "User" u ON rt."userId" = u.id
WHERE rt."isRevoked" = false
  AND rt."expiresAt" > NOW()
GROUP BY u.email;
```

### Check Token Table Size

```sql
SELECT
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE "isRevoked" = false) as active,
  COUNT(*) FILTER (WHERE "isRevoked" = true) as revoked,
  COUNT(*) FILTER (WHERE "expiresAt" < NOW()) as expired
FROM "RefreshToken";
```

## 🎯 Next Steps

Your auth is complete! Consider adding:

1. **Rate limiting** on `/auth/*` endpoints
2. **Email notifications** on new device login
3. **IP-based** suspicious activity detection
4. **Redis cache** for token blacklist (if scaling)

See [REFRESH_TOKEN_IMPLEMENTATION.md](./REFRESH_TOKEN_IMPLEMENTATION.md) for full documentation.

---

**Need Help?** Check the full implementation guide or your backend logs for detailed error messages.
