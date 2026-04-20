import mongoose from 'mongoose'
import { Review } from '../models/Review.js'
import { User } from '../models/User.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function serializeReview(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc }
  const uid = o.userId
  const rid = o.reviewerId

  const subject =
    uid && typeof uid === 'object' && uid !== null && 'name' in uid
      ? { id: uid._id.toString(), name: uid.name, email: uid.email }
      : undefined
  const reviewer =
    rid && typeof rid === 'object' && rid !== null && 'name' in rid
      ? { id: rid._id.toString(), name: rid.name, email: rid.email }
      : undefined

  return {
    id: o._id.toString(),
    userId: typeof uid === 'object' && uid?._id ? uid._id.toString() : uid?.toString(),
    reviewerId: typeof rid === 'object' && rid?._id ? rid._id.toString() : rid?.toString(),
    rating: o.rating,
    comment: o.comment ?? '',
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    ...(subject ? { subject } : {}),
    ...(reviewer ? { reviewer } : {}),
  }
}

export async function submitReview(req, res, next) {
  try {
    const { userId, rating, comment } = req.body ?? {}
    const reviewerId = req.user.id

    if (typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ error: 'userId is required' })
    }
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' })
    }
    if (userId === reviewerId) {
      return res.status(400).json({ error: 'You cannot review yourself' })
    }

    const r = Number(rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be an integer from 1 to 5' })
    }

    const target = await User.findById(userId).select('_id').lean()
    if (!target) {
      return res.status(404).json({ error: 'User not found' })
    }

    const text = typeof comment === 'string' ? comment.trim() : ''

    try {
      const doc = await Review.create({
        userId,
        reviewerId,
        rating: r,
        comment: text,
      })

      await doc.populate([
        { path: 'userId', select: 'name email' },
        { path: 'reviewerId', select: 'name email' },
      ])

      return res.status(201).json({ data: serializeReview(doc) })
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'You have already reviewed this user' })
      }
      throw err
    }
  } catch (err) {
    return next(err)
  }
}

export async function listReviewsForUser(req, res, next) {
  try {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const exists = await User.findById(userId).select('_id').lean()
    if (!exists) {
      return res.status(404).json({ error: 'User not found' })
    }

    const rows = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .populate({ path: 'userId', select: 'name email' })
      .populate({ path: 'reviewerId', select: 'name email' })
      .lean()

    const data = rows.map((row) => serializeReview(row))

    const avg =
      data.length === 0
        ? null
        : Math.round((data.reduce((s, x) => s + x.rating, 0) / data.length) * 10) / 10

    return res.json({
      data,
      meta: { userId, count: data.length, averageRating: avg },
    })
  } catch (err) {
    return next(err)
  }
}
