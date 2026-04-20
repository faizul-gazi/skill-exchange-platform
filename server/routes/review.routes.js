import { Router } from 'express'
import { listReviewsForUser, submitReview } from '../controllers/review.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/user/:userId', listReviewsForUser)
router.post('/', requireAuth, submitReview)

export default router
