import mongoose from 'mongoose'
import { env } from './env.js'

/**
 * Connects to MongoDB Atlas (or any MongoDB URI) using Mongoose.
 */
export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and add your Atlas URI.',
    )
  }

  mongoose.set('strictQuery', true)

  await mongoose.connect(env.mongoUri)

  const { connection } = mongoose
  connection.on('error', (err) => {
    console.error('MongoDB connection error:', err)
  })

  console.log(`MongoDB connected: ${connection.host}`)
}
