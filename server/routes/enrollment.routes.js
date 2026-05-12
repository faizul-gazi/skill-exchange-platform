import { Router } from 'express'
import { enrollInCourse, getMyEnrollments } from '../controllers/enrollment.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireEnrollmentRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/me', requireAuth, requireEnrollmentRole, getMyEnrollments)
router.post('/:courseId', requireAuth, requireEnrollmentRole, enrollInCourse)

export default router

