# Fix Socket Production Deployment Issue

## Current Status: ✅ Step 1 Complete

## Steps Completed:
- [x] 1. Create environment-aware URL utility (`src/services/env.ts`)
- [x] 2. Update API client (`src/services/api.ts`) - remove localhost fallback  
- [x] 3. Fix Socket URL derivation (`src/services/socket.ts`) - proper backend domain + wss

- [ ] 4. Test local development (ensure dev proxy still works)
- [ ] 5. Deploy to Vercel + set environment variables
- [ ] 6. Verify production socket connection (console: ✅ Connected)

## Required Vercel Environment Variables (Frontend Project)
```
VITE_API_URL=https://your-backend.vercel.app/api/v1
VITE_BACKEND_URL=https://your-backend.vercel.app  
```
**Replace `your-backend.vercel.app` with your actual backend URL**

## Backend Already Production-Ready
- ✅ Socket.io CORS configured for Vercel domains
- ✅ allowedOrigins includes `https://*.vercel.app`

## Test Commands (After Deploy)
```bash
# Backend health (replace with your URL)
curl https://your-backend.vercel.app/api/v1/health

# Frontend - Open browser dev tools → Network/Socket tab
# Verify: No localhost requests + WebSocket: ✅ Connected to WebSocket server
```

## Rollback (If Needed)
Files modified: `src/services/api.ts`, `src/services/socket.ts`, `src/services/env.ts` (new)


