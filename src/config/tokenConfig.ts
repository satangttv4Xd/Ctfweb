import tokenData from './token.json';

const STORAGE_AUTH_KEY = 'ctf_auth_token';

/**
 * Get valid tokens list from config or environment variables
 */
export function getValidTokens(): string[] {
  const envToken = import.meta.env.VITE_STATIC_TOKEN;
  const configTokens: string[] = tokenData.tokens || [];
  
  const tokens = [...configTokens];
  if (envToken && typeof envToken === 'string' && envToken.trim()) {
    tokens.push(envToken.trim());
  }
  
  return tokens;
}

/**
 * Verify if a token matches any allowed static token
 */
export function verifyToken(inputToken: string): boolean {
  if (!inputToken || typeof inputToken !== 'string') return false;
  const trimmed = inputToken.trim();
  const validTokens = getValidTokens();
  return validTokens.includes(trimmed);
}

/**
 * Always returns false on new page session load so token must be re-entered every time
 */
export function isTokenAuthenticated(): boolean {
  // Clear any legacy stored tokens
  try {
    localStorage.removeItem(STORAGE_AUTH_KEY);
    sessionStorage.removeItem(STORAGE_AUTH_KEY);
  } catch {
    // ignore
  }
  return false;
}

/**
 * Save auth token dummy helper (no long-term persistence)
 */
export function saveAuthToken(_token: string): void {
  // Do not store in localStorage so token is required every time website opens
}

/**
 * Clear authentication state (Logout / Lock)
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(STORAGE_AUTH_KEY);
    sessionStorage.removeItem(STORAGE_AUTH_KEY);
  } catch {
    // ignore
  }
}
