import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/auth'
import { prisma } from '../services/prisma'
import dayjs from 'dayjs'

export async function recurringRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req) => {
    const { sub } = req.user as { sub: string }
    return prisma.recurringTransaction.findMany({
      where: { userId: sub },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const schema = z.object({
      type: z.enum(['INCOME', 'EXPENSE']),
      amount: z.number().positive(),
      description: z.string().min(1),
      categoryId: z.string().optional(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      startDate: z.string(),
      endDate: z.string().optional(),
    })
    const data = schema.parse(req.body)
    const start = dayjs(data.startDate).startOf('day').toDate()

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId: sub,
        type: data.type,
        amount: data.amount,
        description: data.description,
        categoryId: data.categoryId,
        frequency: data.frequency,
        startDate: start,
        endDate: data.endDate ? dayjs(data.endDate).toDate() : undefined,
        nextDue: start,
        active: true,
      },
      include: { category: true },
    })
    return reply.status(201).send(recurring)
  })

  app.put('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const schema = z.object({
      description: z.string().min(1).optional(),
      amount: z.number().positive().optional(),
      categoryId: z.string().optional(),
      active: z.boolean().optional(),
      endDate: z.string().optional(),
    })
    const data = schema.parse(req.body)
    const rec = await prisma.recurringTransaction.findFirst({ where: { id, userId: sub } })
    if (!rec) return reply.status(404).send({ error: 'Não encontrado' })

    return prisma.recurringTransaction.update({
      where: { id },
      data: { ...data, endDate: data.endDate ? dayjs(data.endDate).toDate() : undefined },
      include: { category: true },
    })
  })

  app.delete('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const rec = await prisma.recurringTransaction.findFirst({ where: { id, userId: sub } })
    if (!rec) return reply.status(404).send({ error: 'Não encontrado' })
    await prisma.recurringTransaction.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Disparo manual do job (útil para testes)
  app.post('/process', async () => {
    const count = await processRecurring()
    return { processed: count }
  })
}

export async function processRecurring(): Promise<number> {
  const today = dayjs().startOf('day')
  let count = 0

  const dues = await prisma.recurringTransaction.findMany({
    where: {
      active: true,
      nextDue: { lte: today.toDate() },
      OR: [{ endDate: null }, { endDate: { gte: today.toDate() } }],
    },
  })

  for (const rec of dues) {
    // Gera a transação para cada vencimento pendente
    let cursor = dayjs(rec.nextDue)
    while (cursor.isBefore(today) || cursor.isSame(today, 'day')) {
      await prisma.transaction.create({
        data: {
          userId: rec.userId,
          categoryId: rec.categoryId,
          recurringTransactionId: rec.id,
          type: rec.type,
          amount: rec.amount,
          description: rec.description,
          date: cursor.toDate(),
          source: 'WEB',
        },
      })
      cursor = nextDate(cursor, rec.frequency as string)
      count++
    }

    // Atualiza nextDue para a próxima data futura
    await prisma.recurringTransaction.update({
      where: { id: rec.id },
      data: {
        nextDue: cursor.toDate(),
        // Desativa se passou da data de fim
        active: rec.endDate ? cursor.isBefore(dayjs(rec.endDate)) : true,
      },
    })
  }

  return count
}

function nextDate(date: dayjs.Dayjs, frequency: string): dayjs.Dayjs {
  switch (frequency) {
    case 'DAILY':   return date.add(1, 'day')
    case 'WEEKLY':  return date.add(1, 'week')
    case 'MONTHLY': return date.add(1, 'month')
    case 'YEARLY':  return date.add(1, 'year')
    default:        return date.add(1, 'month')
  }
}
