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
  // 1. Priority 1: Explicit env var (Vercel/Production)
  const explicitApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (explicitApiUrl) {
    console.log('[ENV] Using explicit VITE_API_URL:', explicitApiUrl);
    return explicitApiUrl;
  }

  // 2. Priority 2: Relative path (same-domain deployment + proxy/CDN)
  if (isProduction()) {
    const relativePath = '/api/v1';
    console.log('[ENV] Using relative API path for production');
    return relativePath;
  }

  // 3. Priority 3: Local dev fallback (Vite proxy)
  console.log('[ENV] Dev mode - using localhost:5000 (Vite proxy)');
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
    const renderUrl = 'https://scorex-backend.onrender.com';
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

