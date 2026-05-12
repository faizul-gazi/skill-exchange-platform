import mongoose from 'mongoose'
import { Request } from '../models/Request.js'
import { User } from '../models/User.js'
import { areUsersMatched } from '../utils/skillExchangeAccess.js'

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

  const completionConfirmedBy = Array.isArray(o.completionConfirmedBy)
    ? o.completionConfirmedBy.map((id) => (id?.toString ? id.toString() : String(id)))
    : []

  return {
    id: o._id.toString(),
    senderId: idStr(sid),
    receiverId: idStr(rid),
    status: o.status,
    meetingLink: o.meetingLink ?? '',
    schedule: o.schedule ?? null,
    completionConfirmedBy,
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

    const [sender, receiver] = await Promise.all([
      User.findById(senderId).select('skillsOffered skillsWanted').lean(),
      User.findById(receiverId).select('_id skillsOffered skillsWanted').lean(),
    ])
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' })
    }
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' })
    }
    if (!areUsersMatched(sender, receiver)) {
      return res.status(403).json({ error: 'You can only send requests to matched users' })
    }

    const existing = await Request.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      status: { $in: ['pending', 'accepted'] },
    }).lean()

    if (existing) {
      return res.status(409).json({ error: 'A request already exists between these users' })
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

function isValidMeetingLink(link) {
  if (typeof link !== 'string') return false
  const value = link.trim()
  if (!value) return false
  return /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(value)
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

export async function confirmExchangeComplete(req, res, next) {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid request id' })
    }

    const doc = await Request.findById(id)
    if (!doc) {
      return res.status(404).json({ error: 'Request not found' })
    }
    const uid = req.user.id
    if (doc.senderId.toString() !== uid && doc.receiverId.toString() !== uid) {
      return res.status(403).json({ error: 'Only participants can confirm exchange completion' })
    }
    if (doc.status === 'completed') {
      await doc.populate([
        { path: 'senderId', select: 'name email' },
        { path: 'receiverId', select: 'name email' },
      ])
      return res.json({
        data: serializeRequest(doc),
        message: 'This exchange is already completed',
      })
    }
    if (doc.status !== 'accepted') {
      return res.status(400).json({ error: 'Only an active accepted exchange can be completed' })
    }

    const uidStr = String(uid)
    const existing = (doc.completionConfirmedBy ?? []).map((x) => String(x))
    if (!existing.includes(uidStr)) {
      doc.completionConfirmedBy.push(uid)
    }

    const senderStr = doc.senderId.toString()
    const receiverStr = doc.receiverId.toString()
    const confirmed = new Set((doc.completionConfirmedBy ?? []).map((x) => String(x)))
    if (confirmed.has(senderStr) && confirmed.has(receiverStr)) {
      doc.status = 'completed'
    }

    await doc.save()
    await doc.populate([
      { path: 'senderId', select: 'name email' },
      { path: 'receiverId', select: 'name email' },
    ])

    return res.json({
      data: serializeRequest(doc),
      message:
        doc.status === 'completed'
          ? 'Exchange marked complete — both participants confirmed.'
          : 'Your confirmation was recorded. Waiting for your partner to confirm.',
    })
  } catch (err) {
    return next(err)
  }
}

export async function updateMeetingLink(req, res, next) {
  try {
    const { id } = req.params
    const { meetingLink, schedule } = req.body ?? {}
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid request id' })
    }

    const doc = await Request.findById(id)
    if (!doc) {
      return res.status(404).json({ error: 'Request not found' })
    }
    const isParticipant =
      doc.senderId.toString() === req.user.id || doc.receiverId.toString() === req.user.id
    if (!isParticipant) {
      return res.status(403).json({ error: 'Only request participants can update the meeting link' })
    }
    if (doc.status !== 'accepted') {
      return res.status(400).json({ error: 'Session details can only be added after request acceptance' })
    }

    const hasMeetingLink = typeof meetingLink === 'string' && meetingLink.trim().length > 0
    const hasSchedule = schedule != null && String(schedule).trim().length > 0
    if (!hasMeetingLink && !hasSchedule) {
      return res.status(400).json({ error: 'Please provide meetingLink or schedule' })
    }

    if (hasMeetingLink) {
      if (!isValidMeetingLink(meetingLink)) {
        return res.status(400).json({ error: 'Please provide a valid Google Meet link' })
      }
      doc.meetingLink = meetingLink.trim()
    }

    if (hasSchedule) {
      const date = new Date(schedule)
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Please provide a valid schedule date/time' })
      }
      doc.schedule = date
    }

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
