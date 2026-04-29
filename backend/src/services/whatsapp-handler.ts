import { prisma } from './prisma'
import { parseWhatsAppMessage, generateReport } from './ai'
import { sendText } from './evolution'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

export async function handleIncomingMessage(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '').replace(/^55/, '')
  const fullPhone = `55${cleanPhone}`

  let user = await prisma.user.findFirst({
    where: { phone: { in: [cleanPhone, fullPhone, phone] } },
  })

  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Usuário', phone: fullPhone },
    })
    await sendText(
      fullPhone,
      `👋 Olá! Sou seu assistente financeiro!\n\nPode me enviar seus gastos e receitas assim:\n\n💸 *"Gastei 50 reais no mercado"*\n💰 *"Recebi 3000 de salário"*\n📊 *"Ver meu saldo"*\n📋 *"Resumo do mês"*\n\nDigite *ajuda* para ver todos os comandos!`,
    )
    return
  }

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    select: { name: true, type: true },
  })

  const categoryNames = categories.map(c => c.name)

  try {
    const parsed = await parseWhatsAppMessage(message, user.name, categoryNames)

    if (parsed.isTransaction && parsed.amount && parsed.type) {
      const cat = await prisma.category.findFirst({
        where: { userId: user.id, name: { equals: parsed.category } },
      })

      if (parsed.isRecurring && parsed.frequency) {
        const freqLabel: Record<string, string> = {
          DAILY: 'diário', WEEKLY: 'semanal', MONTHLY: 'mensal', YEARLY: 'anual',
        }
        await prisma.recurringTransaction.create({
          data: {
            userId: user.id,
            categoryId: cat?.id,
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description,
            frequency: parsed.frequency,
            startDate: dayjs().startOf('day').toDate(),
            nextDue: dayjs().startOf('day').toDate(),
            active: true,
          },
        })
        await sendText(
          fullPhone,
          `🔁 *Gasto fixo cadastrado!*\n\n${parsed.description}\nValor: R$ ${parsed.amount.toFixed(2)}\nFrequência: ${freqLabel[parsed.frequency]}\n\n✅ Será lançado automaticamente toda vez que vencer!`,
        )
      } else {
        await prisma.transaction.create({
          data: {
            userId: user.id,
            categoryId: cat?.id,
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description,
            source: 'WHATSAPP',
          },
        })
        await sendText(fullPhone, parsed.responseMessage)
      }
      return
    }

    if (parsed.isQuery) {
      switch (parsed.queryType) {
        case 'balance': {
          const now = dayjs()
          const [income, expense] = await Promise.all([
            prisma.transaction.aggregate({
              where: { userId: user.id, type: 'INCOME', date: { gte: now.startOf('month').toDate() } },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: { userId: user.id, type: 'EXPENSE', date: { gte: now.startOf('month').toDate() } },
              _sum: { amount: true },
            }),
          ])
          const inc = Number(income._sum.amount || 0)
          const exp = Number(expense._sum.amount || 0)
          const bal = inc - exp
          const emoji = bal >= 0 ? '🟢' : '🔴'
          await sendText(
            fullPhone,
            `${emoji} *Resumo de ${now.format('MMMM')}*\n\n💰 Receitas: R$ ${inc.toFixed(2)}\n💸 Despesas: R$ ${exp.toFixed(2)}\n📊 Saldo: R$ ${bal.toFixed(2)}`,
          )
          break
        }

        case 'summary': {
          const now = dayjs()
          const [income, expense, topCats] = await Promise.all([
            prisma.transaction.aggregate({
              where: { userId: user.id, type: 'INCOME', date: { gte: now.startOf('month').toDate() } },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: { userId: user.id, type: 'EXPENSE', date: { gte: now.startOf('month').toDate() } },
              _sum: { amount: true },
            }),
            prisma.transaction.groupBy({
              by: ['categoryId'],
              where: { userId: user.id, type: 'EXPENSE', date: { gte: now.startOf('month').toDate() } },
              _sum: { amount: true },
              orderBy: { _sum: { amount: 'desc' } },
              take: 3,
            }),
          ])

          const topWithNames = await Promise.all(
            topCats.map(async t => {
              const cat = t.categoryId ? await prisma.category.findUnique({ where: { id: t.categoryId } }) : null
              return { name: cat?.name || 'Outros', total: Number(t._sum.amount || 0) }
            }),
          )

          const report = await generateReport(
            user.name,
            Number(income._sum.amount || 0),
            Number(expense._sum.amount || 0),
            topWithNames,
            now.format('MMMM [de] YYYY'),
          )

          await sendText(fullPhone, report)
          break
        }

        case 'recurring': {
          const recs = await prisma.recurringTransaction.findMany({
            where: { userId: user.id, active: true },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
            take: 8,
          })
          if (recs.length === 0) {
            await sendText(fullPhone, '📭 Nenhum gasto fixo cadastrado.\n\nExemplo: *"Pago 150 de internet todo mês"*')
            break
          }
          const freqLabel: Record<string, string> = {
            DAILY: 'diário', WEEKLY: 'semanal', MONTHLY: 'mensal', YEARLY: 'anual',
          }
          const lines = recs.map(r => {
            const sign = r.type === 'INCOME' ? '💰' : '💸'
            return `${sign} ${r.description} - R$ ${Number(r.amount).toFixed(2)} (${freqLabel[r.frequency]})`
          })
          await sendText(fullPhone, `🔁 *Gastos fixos ativos:*\n\n${lines.join('\n')}`)
          break
        }

        case 'history': {
          const txs = await prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            take: 5,
            include: { category: true },
          })
          if (txs.length === 0) {
            await sendText(fullPhone, '📭 Nenhuma transação encontrada ainda.')
            break
          }
          const lines = txs.map(t => {
            const sign = t.type === 'INCOME' ? '➕' : '➖'
            const cat = t.category?.emoji || ''
            return `${sign} ${cat} ${t.description} - R$ ${Number(t.amount).toFixed(2)} (${dayjs(t.date).format('DD/MM')})`
          })
          await sendText(fullPhone, `📋 *Últimas transações:*\n\n${lines.join('\n')}`)
          break
        }

        default:
          await sendText(
            fullPhone,
            `🤖 *Comandos disponíveis:*\n\n💸 Gasto avulso: "Gastei 50 no mercado"\n💰 Receita avulsa: "Recebi 2000 de salário"\n🔁 Gasto fixo: "Pago 150 de internet todo mês"\n📊 Ver saldo: "Meu saldo"\n📋 Resumo do mês: "Resumo"\n🕐 Histórico: "Ver histórico"\n📅 Gastos fixos: "Meus gastos fixos"\n\nÉ só me enviar uma mensagem! 😊`,
          )
      }
      return
    }

    await sendText(fullPhone, parsed.responseMessage || '🤔 Não entendi. Digite *ajuda* para ver os comandos.')
  } catch (err) {
    console.error('Erro ao processar mensagem:', err)
    await sendText(fullPhone, '⚠️ Ocorreu um erro. Tente novamente em instantes.')
  }
}
