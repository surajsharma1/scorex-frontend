# Socket Production Fix

**Issue:** Socket connecting to localhost in production because env.ts getBackendBaseUrl() returns empty string from relative '/api/v1'.

**Deploy Instructions:**

## Vercel (.env):
```
VITE_API_BASE_URL=https://your-render-app.onrender.com/api/v1
VITE_BACKEND_URL=https://your-render-app.onrender.com
```

## Render backend (.env):
```
FRONTEND_URL=https://your-vercel-app.vercel.app
BACKEND_URL=https://your-render-app.onrender.com
```

**Code is correct** - env.ts prioritizes VITE_API_BASE_URL.

Replace with your actual Render/Vercel URLs.
