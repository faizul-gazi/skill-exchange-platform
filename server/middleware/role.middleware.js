function hasRole(role, allowedRoles) {
  return typeof role === 'string' && allowedRoles.includes(role)
}

function requireAnyRole(allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!hasRole(req.user.role, allowedRoles)) {
      return res.status(403).json({ error: 'You do not have permission for this action' })
    }
    return next()
  }
}

function requireTeacherApproval(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  if ((req.user.role === 'teacher' || req.user.role === 'both') && !req.user.isApproved) {
    return res.status(403).json({ error: 'Teacher account pending admin approval' })
  }
  return next()
}

export const requireTeacherOrBoth = [requireAnyRole(['teacher', 'both']), requireTeacherApproval]
export const requireLearnerOrBoth = requireAnyRole(['learner', 'both'])
export const requireBothRole = [requireAnyRole(['both']), requireTeacherApproval]
export const requireCourseCreatorRole = requireTeacherOrBoth
export const requireEnrollmentRole = requireLearnerOrBoth
export const requireSkillExchangeRole = requireBothRole

