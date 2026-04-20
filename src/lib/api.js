import axios from 'axios'
import { clearStoredAuth, getToken } from './authStorage.js'

const configured = import.meta.env.VITE_API_URL
const trimmed =
  configured != null && String(configured).trim() !== ''
    ? String(configured).replace(/\/$/, '')
    : ''
// Same-origin `/api` is proxied to the Express server by Vite (see vite.config.js).
const baseURL = trimmed || '/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Attach `Authorization: Bearer <jwt>` for every request when a token exists in localStorage.
 * Axios v1 may use AxiosHeaders — support both `.set` and plain assignment.
 */
function setBearerAuthHeader(config, token) {
  const value = `Bearer ${token}`
  const headers = config.headers
  if (!headers) return
  if (typeof headers.set === 'function') {
    headers.set('Authorization', value)
  } else {
    headers.Authorization = value
  }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    setBearerAuthHeader(config, token)
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.config?.headers?.Authorization) {
      clearStoredAuth()
      window.dispatchEvent(new CustomEvent('skillx-auth-expired'))
    }
    return Promise.reject(err)
  },
)
