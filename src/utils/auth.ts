/**
 * Auth utilities for token parsing and membership validation
 */

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'organizer' | 'user';
  membership: 'free' | 'premium-level1' | 'premium-level2';
  exp: number;
}

// Safe JWT Decode (doesn't require external library)
export function parseToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  
  const token = localStorage.getItem('token');
  if (token) return parseToken(token);
  
  return null;
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  const payload = parseToken(token);
  if (!payload) return false;
  
  // Check expiration
  const now = Date.now() / 1000;
  if (payload.exp < now) {
    localStorage.removeItem('token');
    return false;
  }
  
  return true;
}

export function hasRole(role: 'admin' | 'organizer'): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true; // Admin has all permissions
  return user.role === role;
}

export function isPremium(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.membership === 'premium-level1' || user.membership === 'premium-level2' || user.role === 'admin';
}