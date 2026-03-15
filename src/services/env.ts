/**
 * Environment-aware URL utilities for production/development
 * Fixes localhost fallback issue in production deployments
 */

export const isProduction = () => {
  return import.meta.env.MODE === 'production' || 
         import.meta.env.PROD === 'true' ||
         window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1';
};

export const getProtocol = () => {
  return isProduction() ? 'https' : 'http';
};

export const getApiBaseUrl = (): string => {
  // 1. Priority 1: Explicit env var (Vercel/Production)
  const explicitApiUrl = import.meta.env.VITE_API_URL;
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
  const apiUrl = getApiBaseUrl();
  // Strip /api/v1 suffix to get root backend domain
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

export const getSocketUrl = (): string => {
  const backendBase = getBackendBaseUrl();
  
  // Use WebSocket protocol matching current page + backend base
  const protocol = isProduction() ? 'wss' : 'ws';
  
  if (isProduction() && !backendBase.startsWith('http')) {
    // Relative WebSocket for same-domain/CDN proxy setups
    console.log('[ENV] Production relative socket (proxy/CDN)');
    return '/socket.io/';
  }
  
  console.log(`[ENV] Socket URL: ${protocol}://${backendBase}/socket.io/`);
  return `${protocol}://${backendBase}/socket.io/`;
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

