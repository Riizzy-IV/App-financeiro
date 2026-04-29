import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middlewares/auth'
import { prisma } from '../services/prisma'

export async function categoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req) => {
    const { sub } = req.user as { sub: string }
    return prisma.category.findMany({
      where: { userId: sub },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
  })

  app.post('/', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const schema = z.object({
      name: z.string().min(1),
      type: z.enum(['INCOME', 'EXPENSE']),
      emoji: z.string().default('💰'),
      color: z.string().default('#6366f1'),
    })
    const data = schema.parse(req.body)
    const cat = await prisma.category.create({ data: { ...data, userId: sub } })
    return reply.status(201).send(cat)
  })

  app.put('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const schema = z.object({
      name: z.string().min(1).optional(),
      emoji: z.string().optional(),
      color: z.string().optional(),
    })
    const data = schema.parse(req.body)
    const cat = await prisma.category.findFirst({ where: { id, userId: sub } })
    if (!cat) return reply.status(404).send({ error: 'Categoria não encontrada' })
    return prisma.category.update({ where: { id }, data })
  })

  app.delete('/:id', async (req, reply) => {
    const { sub } = req.user as { sub: string }
    const { id } = req.params as { id: string }
    const cat = await prisma.category.findFirst({ where: { id, userId: sub } })
    if (!cat) return reply.status(404).send({ error: 'Categoria não encontrada' })
    await prisma.category.delete({ where: { id } })
    return reply.status(204).send()
  })
}
