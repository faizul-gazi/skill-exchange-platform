import mongoose from 'mongoose'
import app from '../server/app.js'
import { connectDB } from '../server/config/db.js'
import { ensureAdminUser } from '../server/bootstrap/ensureAdminUser.js'

let isConnected = false
async function init() {
  if (mongoose.connection.readyState >= 1) {
    return
  }
  await connectDB()
  try {
    await ensureAdminUser()
  } catch (err) {
    console.error('Admin user check failed:', err)
  }
}

export default async function handler(req, res) {
  try {
    await init()
  } catch (err) {
    console.error('Database connection failed:', err)
    return res.status(500).json({ error: 'Database connection failed' })
  }
  return app(req, res)
}
