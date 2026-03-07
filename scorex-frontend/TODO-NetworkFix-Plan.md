# Network Fix Plan: 404 Error on /api/v1/matches

## Issue Summary
- **Problem**: GET request to `https://scorex-backend.onrender.com/api/v1/matches?tournament=69a4082db3c1361034adfc8a` returns 404
- **Response**: `<pre>Cannot GET /api/v1/matches</pre>`
- **Impact**: Frontend cannot fetch matches data for tournaments

## Root Cause Analysis

### Code Status (Local - CORRECT)
1. **Frontend API** (`scorex-frontend/scorex-frontend/src/services/api.ts`):
   ```typescript
   getMatchesByTournament: (tournamentId: string) => api.get(`/matches?tournament=${tournamentId}`)
   ```
   ✅ Correctly calls the endpoint

2. **Backend Route** (`scorex-backend/scorex-backend/src/routes/matches.ts`):
   ```typescript
   router.get('/', getAllMatches);  // Public route
   ```
   ✅ Route correctly defined

3. **Server Mount** (`scorex-backend/scorex-backend/src/server.ts`):
   ```typescript
   app.use('/api/v1/matches', matchRoutes);
   ```
   ✅ Route correctly mounted

### Deployment Issue (REMOTE - BROKEN)
- Backend deployed on **Render** (`scorex-backend.onrender.com`)
- The deployed version appears to be missing the `/api/v1/matches` route
- This suggests outdated deployment or misconfiguration

## Fix Plan

### Step 1: Verify Render Deployment Configuration
- [ ] Check Render dashboard for `scorex-backend` service
- [ ] Verify the build command: `npm run build` or `npm start`
- [ ] Verify the publish directory/root is correct
- [ ] Check if using correct GitHub repository and branch

### Step 2: Check Environment Variables on Render
- [ ] Verify `MONGODB_URI` is set
- [ ] Verify `JWT_SECRET` is set
- [ ] Verify `BACKEND_URL` is set to `https://scorex-backend.onrender.com`
- [ ] Verify `FRONTEND_URL` is set to `https://scorex-live.vercel.app`

### Step 3: Redeploy Backend to Render
- [ ] Trigger a new deployment on Render
- [ ] Monitor build logs for errors
- [ ] Verify deployment completes successfully

### Step 4: Test Endpoint After Deploy
- [ ] Test `GET /api/v1/matches` without params
- [ ] Test `GET /api/v1/matches?tournament=69a4082db3c1361034adfc8a`
- [ ] Verify both return proper JSON response

### Step 5: Verify Frontend Integration
- [ ] Test from frontend application
- [ ] Verify tournament matches load correctly

## Alternative Solutions

### Option A: Migrate Backend to Vercel
If Render continues to have issues:
- Deploy backend to Vercel alongside frontend
- Use Vercel serverless functions
- Backend URL would become: `https://scorex-backend.vercel.app`

### Option B: Add Error Handling
While fixing the deployment, add better error handling:
```typescript
// In server.ts - add catch-all for missing routes
app.use((req, res) => {
  res.status(404).json({ 
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: '/api/v1/health'
  });
});
```

## Files to Check
1. `scorex-backend/scorex-backend/src/server.ts` - Main server
2. `scorex-backend/scorex-backend/src/routes/matches.ts` - Matches route
3. `scorex-backend/scorex-backend/src/controllers/matchController.ts` - Match controller
4. `scorex-backend/scorex-backend/vercel.json` - Vercel config (if used)

## Action Items
1. **Immediate**: Redeploy backend to Render
2. **Verify**: Test the `/api/v1/matches` endpoint
3. **Monitor**: Check Render logs for any errors

## Expected Outcome
After redeployment:
- `GET /api/v1/matches` returns `{"success": true, "data": [], "count": 0}`
- `GET /api/v1/matches?tournament=...` returns filtered matches

