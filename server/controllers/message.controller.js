import mongoose from 'mongoose'
import { Message } from '../models/Message.js'
import { User } from '../models/User.js'

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

function serializeMessage(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc }
  const sid = o.senderId
  const rid = o.receiverId

  const sender =
    sid && typeof sid === 'object' && sid !== null && 'name' in sid
      ? { id: sid._id.toString(), name: sid.name, email: sid.email }
      : undefined
  const receiver =
    rid && typeof rid === 'object' && rid !== null && 'name' in rid
      ? { id: rid._id.toString(), name: rid.name, email: rid.email }
      : undefined

  return {
    id: o._id.toString(),
    senderId: typeof sid === 'object' && sid?._id ? sid._id.toString() : sid?.toString(),
    receiverId: typeof rid === 'object' && rid?._id ? rid._id.toString() : rid?.toString(),
    message: o.message,
    timestamp: o.timestamp,
    ...(sender ? { sender } : {}),
    ...(receiver ? { receiver } : {}),
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { receiverId, message, timestamp } = req.body ?? {}
    const senderId = req.user.id

    if (typeof receiverId !== 'string' || !receiverId.trim()) {
      return res.status(400).json({ error: 'receiverId is required' })
    }
    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ error: 'Invalid receiverId' })
    }
    if (receiverId === senderId) {
      return res.status(400).json({ error: 'Cannot send a message to yourself' })
    }
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' })
    }

    const receiver = await User.findById(receiverId).select('_id').lean()
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' })
    }

    let ts = new Date()
    if (timestamp != null) {
      const parsed = new Date(timestamp)
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid timestamp' })
      }
      ts = parsed
    }

    const doc = await Message.create({
      senderId,
      receiverId,
      message: message.trim(),
      timestamp: ts,
    })

    await doc.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'receiverId', select: 'name email' },
    ])

    return res.status(201).json({ data: serializeMessage(doc) })
  } catch (err) {
    return next(err)
  }
}

export async function getConversation(req, res, next) {
  try {
    const { peerId } = req.params
    const me = req.user.id

    if (!isValidObjectId(peerId)) {
      return res.status(400).json({ error: 'Invalid peer id' })
    }
    if (peerId === me) {
      return res.status(400).json({ error: 'Invalid peer id' })
    }

    const peer = await User.findById(peerId).select('_id').lean()
    if (!peer) {
      return res.status(404).json({ error: 'User not found' })
    }

    const rows = await Message.find({
      $or: [
        { senderId: me, receiverId: peerId },
        { senderId: peerId, receiverId: me },
      ],
    })
      .sort({ timestamp: 1, _id: 1 })
      .populate({ path: 'senderId', select: 'name email' })
      .populate({ path: 'receiverId', select: 'name email' })
      .lean()

    const data = rows.map((row) => serializeMessage(row))

    return res.json({
      data,
      meta: { peerId, count: data.length },
    })
  } catch (err) {
    return next(err)
  }
}
