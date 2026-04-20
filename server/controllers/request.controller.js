import mongoose from 'mongoose'
import { Request } from '../models/Request.js'
import { User } from '../models/User.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function idStr(ref) {
  if (!ref) return undefined
  if (typeof ref === 'object' && ref !== null && '_id' in ref) {
    return ref._id.toString()
  }
  return ref.toString()
}

/**
 * @param {import('mongoose').Document | Record<string, unknown>} input
 */
function serializeRequest(input) {
  const o = input.toObject ? input.toObject() : { ...input }
  const sid = o.senderId
  const rid = o.receiverId

  const sender =
    sid && typeof sid === 'object' && sid !== null && 'name' in sid
      ? { id: idStr(sid), name: sid.name, email: sid.email }
      : undefined
  const receiver =
    rid && typeof rid === 'object' && rid !== null && 'name' in rid
      ? { id: idStr(rid), name: rid.name, email: rid.email }
      : undefined

  return {
    id: o._id.toString(),
    senderId: idStr(sid),
    receiverId: idStr(rid),
    status: o.status,
    meetingLink: o.meetingLink ?? '',
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    ...(sender ? { sender } : {}),
    ...(receiver ? { receiver } : {}),
  }
}

export async function sendRequest(req, res, next) {
  try {
    const { receiverId, meetingLink } = req.body ?? {}
    const senderId = req.user.id

    if (typeof receiverId !== 'string' || !receiverId.trim()) {
      return res.status(400).json({ error: 'receiverId is required' })
    }
    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ error: 'Invalid receiverId' })
    }
    if (receiverId === senderId) {
      return res.status(400).json({ error: 'Cannot send a request to yourself' })
    }

    const receiver = await User.findById(receiverId).select('_id').lean()
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' })
    }

    const existing = await Request.findOne({
      senderId,
      receiverId,
      status: 'pending',
    }).lean()

    if (existing) {
      return res.status(409).json({ error: 'You already have a pending request to this user' })
    }

    const link = typeof meetingLink === 'string' ? meetingLink.trim() : ''

    const doc = await Request.create({
      senderId,
      receiverId,
      status: 'pending',
      meetingLink: link,
    })

    await doc.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'receiverId', select: 'name email' },
    ])

    return res.status(201).json({ data: serializeRequest(doc) })
  } catch (err) {
    return next(err)
  }
}

export async function acceptRequest(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid request id' })
    }

    const doc = await Request.findById(id)
    if (!doc) {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (doc.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the receiver can accept this request' })
    }
    if (doc.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${doc.status}` })
    }

    doc.status = 'accepted'
    await doc.save()
    await doc.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'receiverId', select: 'name email' },
    ])

    return res.json({ data: serializeRequest(doc) })
  } catch (err) {
    return next(err)
  }
}

export async function rejectRequest(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid request id' })
    }

    const doc = await Request.findById(id)
    if (!doc) {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (doc.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the receiver can reject this request' })
    }
    if (doc.status !== 'pending') {
      return res.status(400).json({ error: `Request is already ${doc.status}` })
    }

    doc.status = 'rejected'
    await doc.save()
    await doc.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'receiverId', select: 'name email' },
    ])

    return res.json({ data: serializeRequest(doc) })
  } catch (err) {
    return next(err)
  }
}

export async function listRequests(req, res, next) {
  try {
    const me = req.user.id
    const type = typeof req.query.type === 'string' ? req.query.type.toLowerCase() : 'all'

    let filter
    if (type === 'incoming') {
      filter = { receiverId: me }
    } else if (type === 'outgoing') {
      filter = { senderId: me }
    } else if (type === 'all') {
      filter = { $or: [{ senderId: me }, { receiverId: me }] }
    } else {
      return res.status(400).json({ error: 'type must be incoming, outgoing, or all' })
    }

    const rows = await Request.find(filter)
      .sort({ updatedAt: -1 })
      .populate({ path: 'senderId', select: 'name email' })
      .populate({ path: 'receiverId', select: 'name email' })
      .lean()

    const data = rows.map((row) => serializeRequest(row))

    return res.json({ data, meta: { type } })
  } catch (err) {
    return next(err)
  }
}
