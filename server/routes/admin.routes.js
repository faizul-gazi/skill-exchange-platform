import { Router } from 'express'
import {
  adminDeleteUser,
  adminListRequests,
  adminListUsers,
  adminStats,
} from '../controllers/admin.controller.js'
import { requireAdmin } from '../middleware/admin.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

const adminOnly = [requireAuth, requireAdmin]

router.get('/users', ...adminOnly, adminListUsers)
router.delete('/users/:id', ...adminOnly, adminDeleteUser)
router.get('/requests', ...adminOnly, adminListRequests)
router.get('/stats', ...adminOnly, adminStats)

export default router
