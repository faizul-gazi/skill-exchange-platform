import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'

/**
 * Allows only unauthenticated users (e.g. login/register pages).
 */
export default function GuestRoute() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
