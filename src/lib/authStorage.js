/**
 * Persisted session in localStorage: `{ user, token }`.
 * `token` is the JWT access string returned by `/auth/login` and `/auth/register`.
 */
export const AUTH_LOCAL_STORAGE_KEY = 'skillx-auth'

export function loadStoredAuth() {
  try {
    if (typeof localStorage === 'undefined') return { user: null, token: null }
    const raw = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY)
    if (!raw) return { user: null, token: null }
    const parsed = JSON.parse(raw)
    return {
      user: parsed?.user ?? null,
      token: typeof parsed?.token === 'string' ? parsed.token : null,
    }
  } catch {
    return { user: null, token: null }
  }
}

/**
 * Writes user + JWT to localStorage (called after login/register).
 */
export function saveAuth({ user, token }) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, JSON.stringify({ user, token }))
}

export function clearStoredAuth() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY)
}

/** Returns the stored JWT access token, or null. */
export function getToken() {
  return loadStoredAuth().token
}
