import mongoose from 'mongoose'
import { Course } from '../models/Course.js'
import { CourseReview } from '../models/CourseReview.js'
import { refreshCourseReviewAggregate } from './courseReview.controller.js'
import { Message } from '../models/Message.js'
import { Request } from '../models/Request.js'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

export async function adminListUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ data: users, meta: { count: users.length } })
  } catch (err) {
    return next(err)
  }
}

export async function adminDeleteUser(req, res, next) {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account from admin' })
    }

    const existing = await User.findById(id).select('_id').lean()
    if (!existing) {
      return res.status(404).json({ error: 'User not found' })
    }

    const courseReviewsForUser = await CourseReview.find({ userId: id }).select('courseId').lean()
    const courseIdsToRefresh = [...new Set(courseReviewsForUser.map((r) => String(r.courseId)))]

    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await Request.deleteMany(
          { $or: [{ senderId: id }, { receiverId: id }] },
          { session },
        )
        await Message.deleteMany(
          { $or: [{ senderId: id }, { receiverId: id }] },
          { session },
        )
        await Review.deleteMany(
          { $or: [{ userId: id }, { reviewerId: id }] },
          { session },
        )
        await CourseReview.deleteMany({ userId: id }, { session })
        await User.findByIdAndDelete(id, { session })
      })
    } finally {
      await session.endSession()
    }

    await Promise.all(
      courseIdsToRefresh.map((cid) => refreshCourseReviewAggregate(new mongoose.Types.ObjectId(cid))),
    )

    return res.json({ ok: true, deletedId: id })
  } catch (err) {
    return next(err)
  }
}

export async function adminApproveUser(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (user.role !== 'teacher' && user.role !== 'both') {
      return res.status(400).json({ error: 'Only teacher or both-role accounts can be approved' })
    }
    if (user.isApproved) {
      return res.json({ ok: true, user: user.toJSON(), message: 'User already approved' })
    }

    user.isApproved = true
    if (user.specialist?.trim()) {
      user.headline = user.specialist.trim()
    }
    user.headlineLocked = true
    await user.save()

    return res.json({
      ok: true,
      user: user.toJSON(),
      message: 'User approved successfully',
    })
  } catch (err) {
    return next(err)
  }
}

export async function adminListRequests(req, res, next) {
  try {
    const rows = await Request.find()
      .sort({ updatedAt: -1 })
      .populate({ path: 'senderId', select: 'name email' })
      .populate({ path: 'receiverId', select: 'name email' })
      .lean()

    const data = rows.map((r) => ({
      id: r._id.toString(),
      senderId: r.senderId?._id?.toString() ?? r.senderId?.toString(),
      receiverId: r.receiverId?._id?.toString() ?? r.receiverId?.toString(),
      status: r.status,
      meetingLink: r.meetingLink ?? '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      sender:
        r.senderId && typeof r.senderId === 'object' && 'name' in r.senderId
          ? { id: r.senderId._id.toString(), name: r.senderId.name, email: r.senderId.email }
          : undefined,
      receiver:
        r.receiverId && typeof r.receiverId === 'object' && 'name' in r.receiverId
          ? { id: r.receiverId._id.toString(), name: r.receiverId.name, email: r.receiverId.email }
          : undefined,
    }))

    return res.json({ data, meta: { count: data.length } })
  } catch (err) {
    return next(err)
  }
}

export async function adminStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalTeachers,
      pendingApprovals,
      totalCourses,
      pendingCourseCompletions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['teacher', 'both'] } }),
      User.countDocuments({ role: { $in: ['teacher', 'both'] }, isApproved: false }),
      Course.countDocuments(),
      Course.countDocuments({ lifecycleStatus: 'completion_pending' }),
    ])

    return res.json({
      data: {
        totalUsers,
        totalTeachers,
        pendingApprovals,
        totalCourses,
        pendingCourseCompletions,
      },
    })
  } catch (err) {
    return next(err)
  }
}

export async function adminListCoursesPendingCompletion(req, res, next) {
  try {
    const rows = await Course.find({ lifecycleStatus: 'completion_pending' })
      .sort({ updatedAt: -1 })
      .populate({ path: 'teacherId', select: 'name email' })
      .lean()
    const data = rows.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      lifecycleStatus: c.lifecycleStatus ?? 'active',
      teacherId: c.teacherId?._id?.toString() ?? c.teacherId?.toString(),
      teacherName:
        c.teacherId && typeof c.teacherId === 'object' && 'name' in c.teacherId ? c.teacherId.name : '',
      teacherEmail:
        c.teacherId && typeof c.teacherId === 'object' && 'email' in c.teacherId ? c.teacherId.email : '',
      updatedAt: c.updatedAt,
    }))
    return res.json({ data, meta: { count: data.length } })
  } catch (err) {
    return next(err)
  }
}

export async function adminApproveCourseCompletion(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }
    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.lifecycleStatus !== 'completion_pending') {
      return res.status(400).json({ error: 'Course is not awaiting completion approval' })
    }
    course.lifecycleStatus = 'completed'
    await course.save()
    const updated = await Course.findById(id).populate({ path: 'teacherId', select: 'name' }).lean()
    return res.json({
      ok: true,
      course: {
        id: updated._id.toString(),
        title: updated.title,
        lifecycleStatus: updated.lifecycleStatus,
      },
      message: 'Course marked as completed',
    })
  } catch (err) {
    return next(err)
  }
}

export async function adminRejectCourseCompletion(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid course id' })
    }
    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.lifecycleStatus !== 'completion_pending') {
      return res.status(400).json({ error: 'Course is not awaiting completion approval' })
    }
    course.lifecycleStatus = 'active'
    await course.save()
    return res.json({
      ok: true,
      course: { id: course._id.toString(), lifecycleStatus: course.lifecycleStatus },
      message: 'Course end request rejected; enrollments reopened',
    })
  } catch (err) {
    return next(err)
  }
}
