import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/auth'
import { prisma } from '../services/prisma'

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req) => {
    const { sub } = req.user as { sub: string }
    const query = req.query as any
    const { page = '1', limit = '20', type, categoryId, month, year } = query

    const where: any = { userId: sub }
    if (type) where.type = type
    if (categoryId) where.categoryId = categoryId
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59)
      where.date = { gte: start, lte: end }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ])

    return { transactions, total, page: Number(page), limit: Number(limit) }
  })

  app.post('/', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const schema = z.object({
      type: z.enum(['INCOME', 'EXPENSE']),
      amount: z.number().positive(),
      description: z.string().min(1),
      categoryId: z.string().optional(),
      date: z.string().optional(),
    })
    const data = schema.parse(req.body)

    const transaction = await prisma.transaction.create({
      data: {
        userId: sub,
        type: data.type,
        amount: data.amount,
        description: data.description,
        categoryId: data.categoryId,
        date: data.date ? new Date(data.date) : new Date(),
        source: 'WEB',
      },
      include: { category: true },
    })
    return reply.status(201).send(transaction)
  })

  app.put('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const schema = z.object({
      type: z.enum(['INCOME', 'EXPENSE']).optional(),
      amount: z.number().positive().optional(),
      description: z.string().min(1).optional(),
      categoryId: z.string().optional(),
      date: z.string().optional(),
    })
    const data = schema.parse(req.body)

    const tx = await prisma.transaction.findFirst({ where: { id, userId: sub } })
    if (!tx) return reply.status(404).send({ error: 'Transação não encontrada' })

    const updated = await prisma.transaction.update({
      where: { id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
      include: { category: true },
    })
    return updated
  })

  app.delete('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }

    const tx = await prisma.transaction.findFirst({ where: { id, userId: sub } })
    if (!tx) return reply.status(404).send({ error: 'Transação não encontrada' })

    await prisma.transaction.delete({ where: { id } })
    return reply.status(204).send()
  })
}
