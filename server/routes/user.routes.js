import { Router } from 'express'
import { getMyProfile, getUserById, listUsers, updateMyProfile } from '../controllers/user.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/me', requireAuth, getMyProfile)
router.put('/me', requireAuth, updateMyProfile)
router.get('/:id', requireAuth, getUserById)
router.get('/', requireAuth, listUsers)

export default router
