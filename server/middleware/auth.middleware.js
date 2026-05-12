import { verifyToken } from '../utils/jwt.js'

/**
 * Expects `Authorization: Bearer <jwt>`.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      isApproved: Boolean(decoded.isApproved),
    }
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/** Sets req.user when a valid Bearer token is present; otherwise continues without failing. */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    delete req.user
    return next()
  }

  try {
    const decoded = verifyToken(token)
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      isApproved: Boolean(decoded.isApproved),
    }
  } catch {
    delete req.user
  }

  return next()
}
