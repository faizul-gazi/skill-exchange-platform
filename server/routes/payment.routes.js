import { Router } from 'express'
import { listMyPayments, submitPayment } from '../controllers/payment.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireEnrollmentRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/me', requireAuth, requireEnrollmentRole, listMyPayments)
router.post('/', requireAuth, requireEnrollmentRole, submitPayment)

export default router

