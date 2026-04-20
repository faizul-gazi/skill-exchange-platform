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
    }
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
