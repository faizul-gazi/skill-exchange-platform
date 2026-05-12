import { Router } from 'express'
import {
  adminApproveCourseCompletion,
  adminApproveUser,
  adminDeleteUser,
  adminListCoursesPendingCompletion,
  adminListRequests,
  adminListUsers,
  adminRejectCourseCompletion,
  adminStats,
} from '../controllers/admin.controller.js'
import {
  adminApprovePayment,
  adminListPendingPayments,
  adminRejectPayment,
} from '../controllers/payment.controller.js'
import { requireAdmin } from '../middleware/admin.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

const adminOnly = [requireAuth, requireAdmin]

router.get('/users', ...adminOnly, adminListUsers)
router.delete('/users/:id', ...adminOnly, adminDeleteUser)
router.patch('/users/:id/approve', ...adminOnly, adminApproveUser)
router.get('/requests', ...adminOnly, adminListRequests)
router.get('/stats', ...adminOnly, adminStats)
router.get('/courses/pending-completion', ...adminOnly, adminListCoursesPendingCompletion)
router.patch('/courses/:id/approve-completion', ...adminOnly, adminApproveCourseCompletion)
router.patch('/courses/:id/reject-completion', ...adminOnly, adminRejectCourseCompletion)
router.get('/payments/pending', ...adminOnly, adminListPendingPayments)
router.patch('/payments/:id/approve', ...adminOnly, adminApprovePayment)
router.patch('/payments/:id/reject', ...adminOnly, adminRejectPayment)

export default router
