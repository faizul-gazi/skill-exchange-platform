import { Router } from 'express'
import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import healthRoutes from './health.routes.js'
import matchRoutes from './match.routes.js'
import messageRoutes from './message.routes.js'
import requestRoutes from './request.routes.js'
import reviewRoutes from './review.routes.js'
import userRoutes from './user.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/admin', adminRoutes)
router.use('/auth', authRoutes)
router.use('/matches', matchRoutes)
router.use('/requests', requestRoutes)
router.use('/messages', messageRoutes)
router.use('/reviews', reviewRoutes)
router.use('/users', userRoutes)

export default router
