import { User } from '../models/User.js'

export async function listUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
}

export async function getMyProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password').lean()
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ user })
  } catch (err) {
    return next(err)
  }
}

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params
    const user = await User.findById(id).select('-password').lean()
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.json({ user })
  } catch (err) {
    return next(err)
  }
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || ''
}

export async function updateMyProfile(req, res, next) {
  try {
    const payload = req.body ?? {}
    const nextName = normalizeOptionalString(payload.name)
    const nextAvatarUrl = normalizeOptionalString(payload.avatarUrl)
    const updates = {
      skillsOffered: normalizeStringArray(payload.skillsOffered),
      skillsWanted: normalizeStringArray(payload.skillsWanted),
      availability: normalizeStringArray(payload.availability),
    }
    if (nextName !== null) {
      updates.name = nextName
    }
    if (nextAvatarUrl !== null) {
      updates.avatarUrl = nextAvatarUrl
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    })
      .select('-password')
      .lean()

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({ user })
  } catch (err) {
    return next(err)
  }
}
