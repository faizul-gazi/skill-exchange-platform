import { Router } from 'express'
import { getConversation, sendMessage } from '../controllers/message.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/', requireAuth, sendMessage)
router.get('/conversation/:peerId', requireAuth, getConversation)

export default router
