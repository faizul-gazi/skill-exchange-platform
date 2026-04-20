import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { signToken } from '../utils/jwt.js'

const SALT_ROUNDS = 10

function normalizeStringArray(value) {
  if (value == null) return []
  if (!Array.isArray(value)) return []
  return value
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
}

export async function register(req, res, next) {
  try {
    const { name, email, password, skillsOffered, skillsWanted, availability } = req.body ?? {}

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean()
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)

    const doc = await User.create({
      name: name.trim(),
      email: email.trim(),
      password: hashed,
      role: 'user',
      skillsOffered: normalizeStringArray(skillsOffered),
      skillsWanted: normalizeStringArray(skillsWanted),
      availability: normalizeStringArray(availability),
    })

    const user = doc.toJSON()
    const token = signToken({ sub: doc._id.toString(), role: doc.role })

    return res.status(201).json({
      token,
      user,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }
    return next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body ?? {}

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken({ sub: user._id.toString(), role: user.role })
    const safe = user.toJSON()

    return res.json({
      token,
      user: safe,
    })
  } catch (err) {
    return next(err)
  }
}
