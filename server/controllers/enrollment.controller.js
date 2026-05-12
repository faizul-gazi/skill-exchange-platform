import mongoose from 'mongoose'
import { Course } from '../models/Course.js'
import { Enrollment } from '../models/Enrollment.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function toEnrollmentResponse(doc) {
  const course = doc.courseId && typeof doc.courseId === 'object' ? doc.courseId : null
  const teacher = course?.teacherId && typeof course.teacherId === 'object' ? course.teacherId : null

  return {
    id: doc._id.toString(),
    userId: doc.userId?.toString?.() ?? String(doc.userId),
    courseId: course?._id?.toString() ?? doc.courseId?.toString?.() ?? String(doc.courseId),
    paymentStatus: doc.paymentStatus,
    enrolledAt: doc.enrolledAt,
    course: course
      ? {
          id: course._id.toString(),
          title: course.title,
          description: course.description,
          price: course.price,
          schedule: course.schedule ?? '',
          meetingLink: course.meetingLink ?? '',
          videoLink: course.videoLink ?? '',
          classDays: Array.isArray(course.classDays) ? course.classDays : [],
          recordings: Array.isArray(course.recordings) ? course.recordings : [],
          createdAt: course.createdAt,
          teacherId: teacher?._id?.toString() ?? course.teacherId?.toString?.() ?? '',
          teacherName: teacher?.name ?? '',
          lifecycleStatus:
            course.lifecycleStatus === 'completion_pending' || course.lifecycleStatus === 'completed'
              ? course.lifecycleStatus
              : 'active',
          reviewCount: typeof course.reviewCount === 'number' ? course.reviewCount : 0,
          reviewAverage:
            course.reviewAverage != null && Number.isFinite(Number(course.reviewAverage))
              ? Number(course.reviewAverage)
              : null,
        }
      : null,
  }
}

export async function enrollInCourse(req, res, next) {
  try {
    const { courseId } = req.params
    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }

    const course = await Course.findById(courseId).select('price teacherId lifecycleStatus').lean()
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.lifecycleStatus !== 'active') {
      return res.status(400).json({ error: 'This course is not accepting new enrollments' })
    }

    const existing = await Enrollment.findOne({ userId: req.user.id, courseId }).select('_id').lean()
    if (existing) {
      return res.status(409).json({ error: 'You are already enrolled in this course' })
    }

    const paymentStatus = Number(course.price ?? 0) > 0 ? 'paid' : 'free'

    const created = await Enrollment.create({
      userId: req.user.id,
      courseId,
      paymentStatus,
      enrolledAt: new Date(),
    })

    return res.status(201).json({
      enrollment: {
        id: created._id.toString(),
        userId: created.userId.toString(),
        courseId: created.courseId.toString(),
        paymentStatus: created.paymentStatus,
        enrolledAt: created.enrolledAt,
      },
      paymentMessage: paymentStatus === 'paid' ? 'Payment Successful' : 'Enrolled for free',
      message: 'Enrollment successful',
    })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'You are already enrolled in this course' })
    }
    return next(err)
  }
}

export async function getMyEnrollments(req, res, next) {
  try {
    const rows = await Enrollment.find({ userId: req.user.id })
      .sort({ enrolledAt: -1 })
      .populate({
        path: 'courseId',
        select:
          'title description price schedule meetingLink videoLink recordings classDays teacherId createdAt lifecycleStatus reviewCount reviewAverage',
        populate: { path: 'teacherId', select: 'name' },
      })
      .lean()

    return res.json({
      data: rows.map(toEnrollmentResponse),
      meta: { count: rows.length },
    })
  } catch (err) {
    return next(err)
  }
}

