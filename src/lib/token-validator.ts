export function isValidToken(token: string): boolean {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Basic JWT structure validation
    return true;
  } catch {
    return false;
  }
}

export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;

    if (!exp) return true;

    // Check if token is expired (with 5 minute buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= exp - 300;
  } catch {
    return true;
  }
}

export function getTokenExpiry(token: string): number | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null;
  } catch {
    return null;
  }
}
