import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/auth'
import { prisma } from '../services/prisma'

export async function goalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req) => {
    const { sub } = req.user as { sub: string }
    return prisma.goal.findMany({ where: { userId: sub }, orderBy: { createdAt: 'desc' } })
  })

  app.post('/', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const schema = z.object({
      name: z.string().min(1),
      targetAmount: z.number().positive(),
      currentAmount: z.number().min(0).default(0),
      deadline: z.string().optional(),
    })
    const data = schema.parse(req.body)
    const goal = await prisma.goal.create({
      data: {
        userId: sub,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
    })
    return reply.status(201).send(goal)
  })

  app.put('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const schema = z.object({
      name: z.string().min(1).optional(),
      targetAmount: z.number().positive().optional(),
      currentAmount: z.number().min(0).optional(),
      deadline: z.string().optional(),
    })
    const data = schema.parse(req.body)
    const goal = await prisma.goal.findFirst({ where: { id, userId: sub } })
    if (!goal) return reply.status(404).send({ error: 'Meta não encontrada' })
    return prisma.goal.update({
      where: { id },
      data: { ...data, deadline: data.deadline ? new Date(data.deadline) : undefined },
    })
  })

  app.delete('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const goal = await prisma.goal.findFirst({ where: { id, userId: sub } })
    if (!goal) return reply.status(404).send({ error: 'Meta não encontrada' })
    await prisma.goal.delete({ where: { id } })
    return reply.status(204).send()
  })
}
