import { Router } from 'express'
import {
  acceptRequest,
  confirmExchangeComplete,
  listRequests,
  rejectRequest,
  sendRequest,
  updateMeetingLink,
} from '../controllers/request.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireBothRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/', requireAuth, requireBothRole, listRequests)
router.post('/', requireAuth, requireBothRole, sendRequest)
router.post('/:id/accept', requireAuth, requireBothRole, acceptRequest)
router.post('/:id/reject', requireAuth, requireBothRole, rejectRequest)
router.post('/:id/confirm-completion', requireAuth, requireBothRole, confirmExchangeComplete)
router.patch('/:id/meeting-link', requireAuth, requireBothRole, updateMeetingLink)
router.patch('/:id/session', requireAuth, requireBothRole, updateMeetingLink)

export default router
