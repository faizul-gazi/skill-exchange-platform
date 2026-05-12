import { Router } from 'express'
import {
  addCourseRecording,
  createCourse,
  getCoursesByTeacher,
  getCourseById,
  getEnrolledStudentsForCourse,
  listCourses,
  requestCourseCompletion,
  updateCourseLinks,
} from '../controllers/course.controller.js'
import {
  getMyCourseReview,
  listCourseReviews,
  submitCourseReview,
} from '../controllers/courseReview.controller.js'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import { requireCourseCreatorRole, requireEnrollmentRole } from '../middleware/role.middleware.js'

const router = Router()

router.get('/', listCourses)
router.get('/teacher/:teacherId', getCoursesByTeacher)
router.get('/:id/enrollments', requireAuth, ...requireCourseCreatorRole, getEnrolledStudentsForCourse)
router.patch('/:id/links', requireAuth, ...requireCourseCreatorRole, updateCourseLinks)
router.post('/:id/recordings', requireAuth, ...requireCourseCreatorRole, addCourseRecording)
router.post('/:id/request-completion', requireAuth, ...requireCourseCreatorRole, requestCourseCompletion)
router.get('/:id/reviews', listCourseReviews)
router.get('/:id/reviews/me', requireAuth, requireEnrollmentRole, getMyCourseReview)
router.post('/:id/reviews', requireAuth, requireEnrollmentRole, submitCourseReview)
router.get('/:id', optionalAuth, getCourseById)
router.post('/', requireAuth, ...requireCourseCreatorRole, createCourse)

export default router

