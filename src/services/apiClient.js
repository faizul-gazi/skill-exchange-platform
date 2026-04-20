/**
 * Base URL for API calls. Point this at your backend when it exists.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiGet(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json()
}
