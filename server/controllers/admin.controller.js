import mongoose from 'mongoose'
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
        await User.findByIdAndDelete(id, { session })
      })
    } finally {
      await session.endSession()
    }

    return res.json({ ok: true, deletedId: id })
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
      totalRequests,
      pendingRequests,
      totalMessages,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Request.countDocuments(),
      Request.countDocuments({ status: 'pending' }),
      Message.countDocuments(),
      Review.countDocuments(),
    ])

    return res.json({
      data: {
        totalUsers,
        totalRequests,
        pendingRequests,
        totalMessages,
        totalReviews,
      },
    })
  } catch (err) {
    return next(err)
  }
}
