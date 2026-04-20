import { Router } from 'express'
import { getMatches } from '../controllers/match.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, getMatches)

export default router
