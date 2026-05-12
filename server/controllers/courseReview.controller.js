import mongoose from 'mongoose'
import { CourseReview } from '../models/CourseReview.js'
import { Course } from '../models/Course.js'
import { Enrollment } from '../models/Enrollment.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

export async function refreshCourseReviewAggregate(courseOid) {
  const agg = await CourseReview.aggregate([
    { $match: { courseId: courseOid } },
    { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: '$rating' } } },
  ])
  const count = agg[0]?.count ?? 0
  const averageRating = count === 0 ? null : Math.round((agg[0].sum / count) * 10) / 10
  await Course.findByIdAndUpdate(courseOid, {
    reviewCount: count,
    reviewAverage: averageRating,
  })
}

function serializeCourseReview(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc }
  const reviewer = o.userId
  return {
    id: o._id.toString(),
    courseId:
      typeof o.courseId === 'object' && o.courseId?._id
        ? o.courseId._id.toString()
        : o.courseId?.toString(),
    userId:
      reviewer && typeof reviewer === 'object' && reviewer !== null && '_id' in reviewer
        ? reviewer._id.toString()
        : o.userId?.toString(),
    rating: o.rating,
    comment: o.comment ?? '',
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    ...(reviewer && typeof reviewer === 'object' && reviewer !== null && 'name' in reviewer
      ? {
          reviewer: {
            id: reviewer._id.toString(),
            name: reviewer.name,
          },
        }
      : {}),
  }
}

export async function listCourseReviews(req, res, next) {
  try {
    const { id: courseId } = req.params
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }

    const courseExists = await Course.findById(courseId).select('_id').lean()
    if (!courseExists) {
      return res.status(404).json({ error: 'Course not found' })
    }

    const limitRaw = Number(req.query.limit ?? 40)
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 40

    const rows = await CourseReview.find({ courseId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'userId', select: 'name' })
      .lean()

    const data = rows.map((row) => serializeCourseReview(row))
    const courseStats = await Course.findById(courseId).select('reviewAverage reviewCount').lean()

    return res.json({
      data,
      meta: {
        count: data.length,
        reviewAverage: courseStats?.reviewAverage ?? null,
        reviewCountTotal: courseStats?.reviewCount ?? 0,
      },
    })
  } catch (err) {
    return next(err)
  }
}

/** Current user's review on this course, if authenticated. */
export async function getMyCourseReview(req, res, next) {
  try {
    const { id: courseId } = req.params
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }

    const row = await CourseReview.findOne({ courseId, userId: req.user.id }).populate({
      path: 'userId',
      select: 'name',
    })
    if (!row) {
      return res.json({ data: null })
    }

    return res.json({ data: serializeCourseReview(row) })
  } catch (err) {
    return next(err)
  }
}

export async function submitCourseReview(req, res, next) {
  try {
    const { id: courseId } = req.params
    const { rating, comment } = req.body ?? {}
    const userId = req.user.id

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }

    const course = await Course.findById(courseId).select('lifecycleStatus teacherId').lean()
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (String(course.teacherId) === String(userId)) {
      return res.status(400).json({ error: 'You cannot review your own course' })
    }
    const lifecycle =
      course.lifecycleStatus === 'completion_pending' || course.lifecycleStatus === 'completed'
        ? course.lifecycleStatus
        : 'active'
    if (lifecycle !== 'completed') {
      return res.status(400).json({
        error: 'Reviews open only after this course has been marked completed',
      })
    }

    const enrolled = await Enrollment.findOne({ userId, courseId }).select('_id').lean()
    if (!enrolled) {
      return res.status(403).json({ error: 'Only enrolled students can review this course' })
    }

    const r = Number(rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be an integer from 1 to 5' })
    }
    const text = typeof comment === 'string' ? comment.trim() : ''

    try {
      await CourseReview.create({
        courseId,
        userId,
        rating: r,
        comment: text,
      })
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: 'You have already reviewed this course' })
      }
      throw err
    }

    await refreshCourseReviewAggregate(new mongoose.Types.ObjectId(courseId))

    const doc = await CourseReview.findOne({ courseId, userId }).populate({
      path: 'userId',
      select: 'name',
    })
    const updatedCourse = await Course.findById(courseId).populate({ path: 'teacherId', select: 'name' }).lean()

    return res.status(201).json({
      data: serializeCourseReview(doc),
      course:
        updatedCourse ?
          {
            id: updatedCourse._id.toString(),
            reviewAverage: updatedCourse.reviewAverage ?? null,
            reviewCount: updatedCourse.reviewCount ?? 0,
          }
        : undefined,
      message: 'Thank you — your review was posted.',
    })
  } catch (err) {
    return next(err)
  }
}
