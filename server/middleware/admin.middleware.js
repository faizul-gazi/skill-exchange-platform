/**
 * Must run after {@link import('./auth.middleware.js').requireAuth}.
 * Restricts routes to users whose JWT role is `admin`.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  return next()
}
