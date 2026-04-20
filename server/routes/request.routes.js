import { Router } from 'express'
import {
  acceptRequest,
  listRequests,
  rejectRequest,
  sendRequest,
} from '../controllers/request.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', requireAuth, listRequests)
router.post('/', requireAuth, sendRequest)
router.post('/:id/accept', requireAuth, acceptRequest)
router.post('/:id/reject', requireAuth, rejectRequest)

export default router
