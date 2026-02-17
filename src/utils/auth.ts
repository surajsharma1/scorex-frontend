/**
 * Auth utilities for token parsing and membership validation
 */

export interface TokenPayload {
  id: string;
  role: string;
  membership: string;
  membershipExpiresAt?: string;
  exp?: number;
  iat?: number;
}

/**
 * Parse JWT token and return the payload
 */
export function parseToken(): TokenPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

/**
 * Get the current user's effective membership level
 * Returns 'free' if membership has expired
 */
export function getEffectiveMembership(): string {
  const payload = parseToken();
  if (!payload) return 'free';

  // Admin always has full access
  if (payload.role === 'admin') {
    return 'pro';
  }

  let membership = payload.membership || 'free';

  // Check if membership has expired
  if (payload.membershipExpiresAt) {
    const expiryDate = new Date(payload.membershipExpiresAt);
    if (expiryDate < new Date()) {
      // Membership has expired
      return 'free';
    }
  }

  return membership;
}

/**
 * Get the membership expiry date if available
 */
export function getMembershipExpiryDate(): Date | null {
  const payload = parseToken();
  if (!payload?.membershipExpiresAt) return null;

  return new Date(payload.membershipExpiresAt);
}

/**
 * Check if the membership is currently active (not expired)
 */
export function isMembershipActive(): boolean {
  const payload = parseToken();
  if (!payload) return false;

  // Free membership is always "active"
  if (!payload.membership || payload.membership === 'free') {
    return true;
  }

  // Admin always has active membership
  if (payload.role === 'admin') {
    return true;
  }

  // Check expiry
  if (payload.membershipExpiresAt) {
    const expiryDate = new Date(payload.membershipExpiresAt);
    return expiryDate >= new Date();
  }

  // No expiry date means legacy membership (treat as active)
  return true;
}

/**
 * Check if user has access to a specific membership level
 */
export function hasAccess(requiredLevel: 'free' | 'premium-level1' | 'premium-level2' | 'pro'): boolean {
  const membership = getEffectiveMembership();

  const levels: Record<string, number> = {
    'free': 0,
    'premium': 1,
    'premium-level1': 1,
    'premium-level2': 2,
    'pro': 3,
  };

  const userLevel = levels[membership] ?? 0;
  const requiredLevelNum = levels[requiredLevel] ?? 0;

  return userLevel >= requiredLevelNum;
}

/**
 * Get user role from token
 */
export function getUserRole(): string {
  const payload = parseToken();
  return payload?.role || 'viewer';
}
