import { Router } from 'express'
import { getExchangeReviewEligibility, listReviewsForUser, submitReview } from '../controllers/review.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireBothRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/exchange-eligibility/:targetUserId', requireAuth, requireBothRole, getExchangeReviewEligibility)
router.get('/user/:userId', listReviewsForUser)
router.post('/', requireAuth, requireBothRole, submitReview)

export default router
