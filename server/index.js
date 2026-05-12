import { env } from './config/env.js'
import app from './app.js'
import { ensureAdminUser } from './bootstrap/ensureAdminUser.js'
import { connectDB } from './config/db.js'

async function main() {
  await connectDB()
  await ensureAdminUser()

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
