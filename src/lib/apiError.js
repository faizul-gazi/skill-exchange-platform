/**
 * Normalize Axios (and similar) errors into a single user-facing string.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error == null) return fallback

  const data = error.response?.data
  if (typeof data === 'string' && data.trim()) return data

  if (data != null && typeof data === 'object') {
    if (typeof data.error === 'string' && data.error.trim()) return data.error
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0]
      if (typeof first === 'string') return first
      if (first && typeof first.msg === 'string') return first.msg
      if (first && typeof first.message === 'string') return first.message
    }
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes?.('timeout')) {
    return 'Request timed out. Please try again.'
  }
  if (error.message === 'Network Error' || !error.response) {
    if (import.meta.env.DEV) {
      return 'Could not reach the API. Start the backend from the server folder, wait for MongoDB connected, and keep the frontend on the Vite dev URL so /api proxies to port 5000.'
    }
    return 'Network error. Check your connection and try again.'
  }

  if (typeof error.message === 'string' && error.message && error.message !== 'Error') {
    return error.message
  }

  return fallback
}
