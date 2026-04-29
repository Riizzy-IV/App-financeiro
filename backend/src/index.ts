import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { transactionRoutes } from './routes/transactions'
import { categoryRoutes } from './routes/categories'
import { reportRoutes } from './routes/reports'
import { goalRoutes } from './routes/goals'
import { webhookRoutes } from './routes/webhook'
import { recurringRoutes } from './routes/recurring'
import { startScheduler } from './services/scheduler'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
})

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret',
})

app.register(authRoutes, { prefix: '/auth' })
app.register(transactionRoutes, { prefix: '/transactions' })
app.register(categoryRoutes, { prefix: '/categories' })
app.register(reportRoutes, { prefix: '/reports' })
app.register(goalRoutes, { prefix: '/goals' })
app.register(recurringRoutes, { prefix: '/recurring' })
app.register(webhookRoutes, { prefix: '/webhook' })

app.get('/health', async () => ({ status: 'ok' }))

const port = Number(process.env.PORT) || 3333
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  startScheduler()
})
