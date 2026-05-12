import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'

export default function RoleRoute({ allowedRoles = [], requireApprovedTeacher = false, redirectTo = '/dashboard' }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const role = user?.role
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  if (requireApprovedTeacher && (role === 'teacher' || role === 'both') && !user?.isApproved) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

