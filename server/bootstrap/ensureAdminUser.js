import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { User } from '../models/User.js'

const SALT_ROUNDS = 10

export async function ensureAdminUser() {
  const email = env.adminEmail.trim().toLowerCase()
  const password = env.adminPassword

  if (!email || !password) return

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)

  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: env.adminName.trim() || 'Administrator',
        role: 'admin',
        isApproved: true,
        password: hashed,
      },
      $setOnInsert: {
        skillsOffered: [],
        skillsWanted: [],
        availability: [],
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  )

  console.log(`Admin user ready: ${email}`)
}
