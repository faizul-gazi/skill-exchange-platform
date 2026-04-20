import dotenv from 'dotenv'

dotenv.config()

const port = Number.parseInt(process.env.PORT ?? '5000', 10)

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.isFinite(port) && port > 0 ? port : 5000,
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}
