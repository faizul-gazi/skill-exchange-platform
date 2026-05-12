import mongoose from 'mongoose'
import { Course } from '../models/Course.js'
import { Enrollment } from '../models/Enrollment.js'
import { Payment } from '../models/Payment.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function serializePayment(row) {
  return {
    id: row._id.toString(),
    userId: row.userId?._id?.toString() ?? row.userId?.toString(),
    courseId: row.courseId?._id?.toString() ?? row.courseId?.toString(),
    paymentMethod: row.paymentMethod,
    trxId: row.trxId,
    status: row.status,
    userName:
      row.userId && typeof row.userId === 'object' && 'name' in row.userId ? row.userId.name : undefined,
    userEmail:
      row.userId && typeof row.userId === 'object' && 'email' in row.userId ? row.userId.email : undefined,
    courseTitle:
      row.courseId && typeof row.courseId === 'object' && 'title' in row.courseId ? row.courseId.title : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function submitPayment(req, res, next) {
  try {
    const { courseId, paymentMethod, trxId } = req.body ?? {}
    const userId = req.user.id

    if (typeof courseId !== 'string' || !isValidObjectId(courseId)) {
      return res.status(400).json({ error: 'A valid courseId is required' })
    }
    if (!['Bkash', 'Nagad', 'Rocket'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod must be Bkash, Nagad, or Rocket' })
    }
    if (typeof trxId !== 'string' || !trxId.trim()) {
      return res.status(400).json({ error: 'trxId is required' })
    }

    const course = await Course.findById(courseId).select('price lifecycleStatus').lean()
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.lifecycleStatus !== 'active') {
      return res.status(400).json({ error: 'This course is not accepting new enrollments' })
    }
    if (Number(course.price) <= 0) {
      return res.status(400).json({ error: 'Free course does not require payment request' })
    }

    const existingEnrollment = await Enrollment.findOne({ userId, courseId }).select('_id').lean()
    if (existingEnrollment) {
      return res.status(409).json({ error: 'You are already enrolled in this course' })
    }

    const existingPending = await Payment.findOne({ userId, courseId, status: 'pending' })
      .select('_id')
      .lean()
    if (existingPending) {
      return res.status(409).json({ error: 'A payment request is already pending for this course' })
    }

    const created = await Payment.create({
      userId,
      courseId,
      paymentMethod,
      trxId: trxId.trim(),
      status: 'pending',
    })

    return res.status(201).json({
      data: serializePayment(created),
      message: 'Payment submitted, waiting for admin approval',
    })
  } catch (err) {
    return next(err)
  }
}

export async function listMyPayments(req, res, next) {
  try {
    const rows = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'courseId', select: 'title price schedule teacherId' })
      .lean()
    return res.json({ data: rows.map(serializePayment), meta: { count: rows.length } })
  } catch (err) {
    return next(err)
  }
}

export async function adminListPendingPayments(_req, res, next) {
  try {
    const rows = await Payment.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate({ path: 'userId', select: 'name email' })
      .populate({ path: 'courseId', select: 'title price' })
      .lean()
    return res.json({ data: rows.map(serializePayment), meta: { count: rows.length } })
  } catch (err) {
    return next(err)
  }
}

export async function adminApprovePayment(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid payment id' })
    }

    const payment = await Payment.findById(id)
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: `Payment already ${payment.status}` })
    }

    const paymentCourse = await Course.findById(payment.courseId).select('lifecycleStatus').lean()
    if (!paymentCourse) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (paymentCourse.lifecycleStatus !== 'active') {
      return res.status(400).json({
        error: 'Course is closed for new enrollment; reject this payment or ask the payer to contact support.',
      })
    }

    const existingEnrollment = await Enrollment.findOne({
      userId: payment.userId,
      courseId: payment.courseId,
    })
      .select('_id')
      .lean()
    if (!existingEnrollment) {
      await Enrollment.create({
        userId: payment.userId,
        courseId: payment.courseId,
        paymentStatus: 'paid',
        enrolledAt: new Date(),
      })
    }

    payment.status = 'approved'
    await payment.save()

    return res.json({ ok: true, status: payment.status, message: 'Payment approved and enrollment created' })
  } catch (err) {
    if (err?.code === 11000) {
      // Duplicate enrollment race; payment should still move to approved.
      try {
        const payment = await Payment.findById(req.params.id)
        if (payment && payment.status === 'pending') {
          payment.status = 'approved'
          await payment.save()
        }
      } catch {
        // no-op
      }
      return res.json({ ok: true, status: 'approved', message: 'Payment approved' })
    }
    return next(err)
  }
}

export async function adminRejectPayment(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid payment id' })
    }
    const payment = await Payment.findById(id)
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    if (payment.status !== 'pending') {
      return res.status(400).json({ error: `Payment already ${payment.status}` })
    }
    payment.status = 'rejected'
    await payment.save()
    return res.json({ ok: true, status: payment.status, message: 'Payment rejected' })
  } catch (err) {
    return next(err)
  }
}

