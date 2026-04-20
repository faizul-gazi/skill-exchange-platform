import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { clearStoredAuth, saveAuth } from '../lib/authStorage.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [{ user, token }, setState] = useState({ user: null, token: null })

  useEffect(() => {
    clearStoredAuth()
    const onExpired = () => setState({ user: null, token: null })
    window.addEventListener('skillx-auth-expired', onExpired)
    return () => window.removeEventListener('skillx-auth-expired', onExpired)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const next = { user: data.user, token: data.token }
    saveAuth(next)
    setState(next)
    try {
      const meRes = await api.get('/users/me')
      const freshUser = meRes.data?.user
      if (freshUser) {
        const synced = { user: freshUser, token: data.token }
        saveAuth(synced)
        setState(synced)
      }
    } catch {
      // Keep login successful even if profile refresh fails.
    }
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    return data
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setState({ user: null, token: null })
  }, [])

  const updateUser = useCallback((nextUser) => {
    setState((prev) => {
      const next = {
        ...prev,
        user: nextUser ?? null,
      }
      saveAuth(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
