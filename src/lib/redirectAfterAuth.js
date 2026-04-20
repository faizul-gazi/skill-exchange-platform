/**
 * Returns a safe in-app path for post-login / post-register navigation.
 * Rejects absolute URLs and odd paths to avoid open redirects.
 */
export function getSafeRedirectPath(pathname, fallback = '/dashboard') {
  if (typeof pathname !== 'string' || pathname.length < 1) return fallback
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return fallback
  if (pathname === '/login' || pathname === '/register') return fallback
  return pathname
}
