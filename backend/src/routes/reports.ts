import { FastifyInstance } from 'fastify'
import { authenticate } from '../middlewares/auth'
import { prisma } from '../services/prisma'

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // Resumo mensal
  app.get('/monthly', async (req) => {
    const { sub } = req.user as { sub: string }
    const { month, year } = req.query as { month?: string; year?: string }
    const now = new Date()
    const m = Number(month || now.getMonth() + 1)
    const y = Number(year || now.getFullYear())

    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59)

    const [income, expense, byCategory] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: sub, type: 'INCOME', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: sub, type: 'EXPENSE', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId', 'type'],
        where: { userId: sub, date: { gte: start, lte: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ])

    const categoryIds = byCategory.map(b => b.categoryId).filter(Boolean) as string[]
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    })

    const enriched = byCategory.map(b => ({
      ...b,
      category: categories.find(c => c.id === b.categoryId) || null,
      total: Number(b._sum.amount || 0),
    }))

    return {
      income: Number(income._sum.amount || 0),
      expense: Number(expense._sum.amount || 0),
      balance: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0),
      byCategory: enriched,
    }
  })

  // Evolução mensal dos últimos 6 meses
  app.get('/evolution', async (req) => {
    const { sub } = req.user as { sub: string }
    const results = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: sub, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: sub, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ])

      results.push({
        month: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        income: Number(income._sum.amount || 0),
        expense: Number(expense._sum.amount || 0),
        balance: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0),
      })
    }

    return results
  })

  // Dashboard stats
  app.get('/dashboard', async (req) => {
    const { sub } = req.user as { sub: string }
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [income, expense, totalTransactions, recentTxs, goals] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: sub, type: 'INCOME', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: sub, type: 'EXPENSE', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { userId: sub, date: { gte: start, lte: end } } }),
      prisma.transaction.findMany({
        where: { userId: sub },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true },
      }),
      prisma.goal.findMany({ where: { userId: sub } }),
    ])

    return {
      income: Number(income._sum.amount || 0),
      expense: Number(expense._sum.amount || 0),
      balance: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0),
      totalTransactions,
      recentTransactions: recentTxs,
      goals,
    }
  })
}
