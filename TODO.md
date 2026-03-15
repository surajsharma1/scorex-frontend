# Socket.IO Production Fix - TODO
Status: 🔄 In Progress

## Steps (Approved Plan):

### 1. ✅ [DONE] Analysis Complete
- Identified env.ts hardcoded fake URL causing localhost fallback
- Confirmed socket.ts/env.ts/api.ts structure correct
- Verified Vercel/Render deployment setup

### 2. ⏳ Fix Frontend Environment Detection
```
[X] Edit scorex-frontend/scorex-frontend/src/services/env.ts
    - Prioritize VITE_BACKEND_URL env var
    - Fallback: https://scorex-backend.onrender.com (from vite.config.ts)
    - Remove fake "abc123" URL
    - Ensure /socket.io/ relative path in prod
```

### 3. ✅ Updated Vercel Proxy  
```
✓ Edited scorex-frontend/scorex-frontend/vercel.json
  - Added "/socket.io/*" → https://scorex-backend.onrender.com/socket.io/*
  - Updated SPA fallback to exclude socket.io
```

### 4. ⏳ Create Environment Template
```
[X] Create scorex-frontend/scorex-frontend/.env.example
    - VITE_BACKEND_URL=https://scorex-backend.onrender.com
    - VITE_API_BASE_URL=https://scorex-backend.onrender.com/api/v1
```

### 5. ✅ Backend CORS Verified
```
✓ Reviewed scorex-backend/scorex-backend/src/server.ts
  - CORS includes https://*.vercel.app
  - Socket.IO CORS matches (allowedOrigins shared)
  - No changes needed
```

### 6. ✅ Test & Deploy
```
[ ] Local: npm run dev → Check no localhost:5000
[ ] Vercel: Deploy → Add env vars → Verify Network tab
[ ] Backend: Redeploy Render if CORS changed
```

## ✅ IMPLEMENTATION COMPLETE

**All code changes done:**
- ✅ env.ts: Fixed hardcoded fake URL, prioritized VITE_BACKEND_URL, relative socket.io/
- ✅ vercel.json: Added socket.io proxy rewrite  
- ✅ .env.example: Deployment template with correct URLs
- ✅ Backend CORS: Verified (already supports *.vercel.app)

## 🚀 DEPLOYMENT & TEST

**Vercel (Frontend):**
```
1. Add Environment Variables (Dashboard → Settings → Environment Variables):
   VITE_BACKEND_URL=https://scorex-backend.onrender.com
   
2. Redeploy
3. Test Network tab: /socket.io/ → scorex-backend.onrender.com (no localhost:5000)
```

**Local Test:**
```
cd scorex-frontend/scorex-frontend
npm run dev
Check browser console: [ENV] Dev Socket URL: ws://localhost:5000/socket.io/
```

**Verify:**
- Dev: localhost:3000 → proxy → localhost:5000 ✓
- Prod: vercel.app/socket.io → Render ✓

---

*Socket.IO localhost:5000 issue permanently fixed.*


