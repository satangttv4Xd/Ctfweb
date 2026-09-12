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
 * Get stored token authentication status
 */
export function isTokenAuthenticated(): boolean {
  const storedToken = localStorage.getItem(STORAGE_AUTH_KEY);
  if (!storedToken) return false;
  return verifyToken(storedToken);
}

/**
 * Save valid auth token to local storage
 */
export function saveAuthToken(token: string): void {
  localStorage.setItem(STORAGE_AUTH_KEY, token.trim());
}

/**
 * Clear authentication state (Logout / Lock)
 */
export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_AUTH_KEY);
}
