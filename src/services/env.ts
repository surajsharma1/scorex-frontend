/**
 * Environment-aware URL utilities for production/development
 * Fixes localhost fallback issue in production deployments
 */

export const isProduction = () => {
  return import.meta.env.MODE === 'production' || 
         import.meta.env.PROD ||
         (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
};

export const getProtocol = () => {
  return isProduction() ? 'https' : 'http';
};

export const getApiBaseUrl = (): string => {
  // 1. Priority 1: Explicit env var (Vercel/Production) - ensure /api/v1 suffix
  const explicitApiUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (explicitApiUrl) {
    const fixedUrl = explicitApiUrl.endsWith('/api/v1') ? explicitApiUrl : `${explicitApiUrl}/api/v1`;
    console.log('[ENV] Using explicit VITE_API_URL (fixed):', fixedUrl);
    return fixedUrl;
  }

  // 2. Priority 2: Full backend URL for production
  if (isProduction()) {
    const fullBackendUrl = 'https://scorex-backend.onrender.com/api/v1';
    console.log('[ENV] Production: Full backend URL for API:', fullBackendUrl);
    return fullBackendUrl;
  }

  // 3. Priority 3: Local dev fallback (Vite proxy)
  console.log('[ENV] Dev mode - using localhost:5000/api/v1 (Vite proxy)');
  return 'http://localhost:5000/api/v1';
};

export const getBackendBaseUrl = (): string => {
  // 1. Priority 1: Explicit VITE_BACKEND_URL (Vercel/Render)
  const explicitBackendUrl = import.meta.env.VITE_BACKEND_URL;
  if (explicitBackendUrl) {
    console.log('[ENV] Using VITE_BACKEND_URL:', explicitBackendUrl);
    return explicitBackendUrl;
  }

  // 2. Priority 2: Extract from VITE_API_BASE_URL
  const apiUrl = getApiBaseUrl();
  const backendFromApi = apiUrl.replace(/\/api(\/v1)?(\/.*)?$/, '');
  if (backendFromApi !== apiUrl) {
    console.log('[ENV] Backend from API URL:', backendFromApi);
    return backendFromApi;
  }

  // 3. Priority 3: Production fallback (real Render URL)
  if (isProduction()) {
    const renderUrl = 'https://scorex-backend.onrender.com/api/v1';
    console.log('[ENV] Production fallback Render URL:', renderUrl);
    return renderUrl;
  }

  // 4. Dev fallback
  console.log('[ENV] Dev fallback - localhost:5000');
  return 'http://localhost:5000';
};

export const getSocketUrl = (): string => {
  // 1. Priority 1: Relative path (Vercel proxy) - BEST for production
  if (isProduction()) {
    console.log('[ENV] Production: Using relative /socket.io/ (Vercel proxy)');
    return '/socket.io/';
  }

  // 2. Dev: Use proper WS protocol
  const backendBase = getBackendBaseUrl();
  const protocol = getProtocol().replace('http', 'ws');
  const url = `${protocol}://${backendBase}/socket.io/`;
  console.log(`[ENV] Dev Socket URL: ${url}`);
  return url;
};

// Export for debugging
console.log('[ENV] Environment detection:', {
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  isProd: isProduction(),
  apiBase: getApiBaseUrl(),
  socketUrl: getSocketUrl(),
});

// Re-export for backwards compatibility
export const getApiBase = getApiBaseUrl;
export const getSocketBase = getBackendBaseUrl;

