import cors from 'cors'
import express from 'express'
import routes from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Skill Exchange API',
    docs: {
      health: '/api/health',
      auth: '/api/auth',
      matches: '/api/matches',
      requests: '/api/requests',
      messages: '/api/messages',
      reviews: '/api/reviews',
      admin: '/api/admin',
    },
  })
})

app.use('/api', routes)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Express requires four arguments for error-handling middleware.
app.use((err, req, res, _next) => {
  void _next
  console.error(err)
  const status = err.statusCode ?? err.status ?? 500
  res.status(status).json({
    error: err.message ?? 'Internal server error',
  })
})

export default app
