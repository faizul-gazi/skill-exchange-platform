import { Router } from 'express'
import { getConversation, sendMessage } from '../controllers/message.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireBothRole } from '../middleware/role.middleware.js'

const router = Router()

router.post('/', requireAuth, requireBothRole, sendMessage)
router.get('/conversation/:peerId', requireAuth, requireBothRole, getConversation)

export default router
