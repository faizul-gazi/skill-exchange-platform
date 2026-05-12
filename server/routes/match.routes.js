import { Router } from 'express'
import { getMatches } from '../controllers/match.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireBothRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/', requireAuth, requireBothRole, getMatches)

export default router
