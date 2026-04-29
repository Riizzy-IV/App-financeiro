import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../services/prisma'
import { authenticate } from '../middlewares/auth'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      phone: z.string().min(10),
      email: z.string().email().optional(),
      password: z.string().min(6),
    })

    const data = schema.parse(req.body)
    const hash = await bcrypt.hash(data.password, 10)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone: data.phone }, { email: data.email }] },
    })
    if (existing) return reply.status(409).send({ error: 'Usuário já existe' })

    const user = await prisma.user.create({
      data: { ...data, password: hash },
    })

    // Cria categorias padrão
    const defaults = [
      { name: 'Alimentação', type: 'EXPENSE' as const, emoji: '🍔', color: '#ef4444' },
      { name: 'Transporte', type: 'EXPENSE' as const, emoji: '🚗', color: '#f97316' },
      { name: 'Moradia', type: 'EXPENSE' as const, emoji: '🏠', color: '#eab308' },
      { name: 'Saúde', type: 'EXPENSE' as const, emoji: '🏥', color: '#22c55e' },
      { name: 'Lazer', type: 'EXPENSE' as const, emoji: '🎮', color: '#8b5cf6' },
      { name: 'Outros', type: 'EXPENSE' as const, emoji: '💸', color: '#6b7280' },
      { name: 'Salário', type: 'INCOME' as const, emoji: '💼', color: '#10b981' },
      { name: 'Freelance', type: 'INCOME' as const, emoji: '💻', color: '#06b6d4' },
      { name: 'Outros (receita)', type: 'INCOME' as const, emoji: '💰', color: '#84cc16' },
    ]
    await prisma.category.createMany({
      data: defaults.map(d => ({ ...d, userId: user.id, isDefault: true })),
    })

    const token = app.jwt.sign({ sub: user.id, name: user.name })
    return { token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } }
  })

  app.post('/login', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    })
    const { email, password } = schema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return reply.status(401).send({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return reply.status(401).send({ error: 'Credenciais inválidas' })

    const token = app.jwt.sign({ sub: user.id, name: user.name })
    return { token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } }
  })

  app.get('/me', { preHandler: [authenticate] }, async (req) => {
    const { sub } = req.user as { sub: string }
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    })
    return user
  })
}

