import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Transaction, Category, Goal, RecurringTransaction, Frequency } from '../types'

function cuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function addMonths(date: Date, n: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function nextDueDate(from: Date, frequency: Frequency): Date {
  const d = new Date(from)
  switch (frequency) {
    case 'DAILY':   d.setDate(d.getDate() + 1); break
    case 'WEEKLY':  d.setDate(d.getDate() + 7); break
    case 'MONTHLY': return addMonths(d, 1)
    case 'YEARLY':  d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

// Gera todas as transações vencidas de um recorrente até hoje
function generateDueTransactions(
  rec: RecurringTransaction,
  existingTxIds: Set<string>,
): { transactions: Transaction[]; nextDue: string } {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  let cursor = new Date(rec.nextDue)
  const generated: Transaction[] = []

  while (cursor <= today) {
    if (rec.endDate && cursor > new Date(rec.endDate)) break

    // Chave única para evitar duplicatas: recorrente + data
    const dateKey = cursor.toISOString().slice(0, 10)
    const dedupId = `${rec.id}-${dateKey}`
    if (!existingTxIds.has(dedupId)) {
      generated.push({
        id: cuid(),
        type: rec.type,
        amount: rec.amount,
        description: rec.description,
        date: new Date(cursor).toISOString(),
        source: 'WEB',
        categoryId: rec.categoryId,
        category: rec.category,
        createdAt: new Date().toISOString(),
        recurringId: rec.id,
        recurringDedupKey: dedupId,
      } as Transaction)
    }

    cursor = nextDueDate(cursor, rec.frequency as Frequency)
  }

  return { transactions: generated, nextDue: cursor.toISOString() }
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', type: 'EXPENSE', emoji: '🍔', color: '#ef4444', isDefault: true },
  { id: 'cat-transporte',  name: 'Transporte',  type: 'EXPENSE', emoji: '🚗', color: '#f97316', isDefault: true },
  { id: 'cat-moradia',     name: 'Moradia',     type: 'EXPENSE', emoji: '🏠', color: '#eab308', isDefault: true },
  { id: 'cat-saude',       name: 'Saúde',       type: 'EXPENSE', emoji: '🏥', color: '#22c55e', isDefault: true },
  { id: 'cat-lazer',       name: 'Lazer',       type: 'EXPENSE', emoji: '🎮', color: '#8b5cf6', isDefault: true },
  { id: 'cat-roupas',      name: 'Roupas',      type: 'EXPENSE', emoji: '👕', color: '#ec4899', isDefault: true },
  { id: 'cat-educacao',    name: 'Educação',    type: 'EXPENSE', emoji: '📚', color: '#3b82f6', isDefault: true },
  { id: 'cat-outros-exp',  name: 'Outros',      type: 'EXPENSE', emoji: '💸', color: '#6b7280', isDefault: true },
  { id: 'cat-salario',     name: 'Salário',     type: 'INCOME',  emoji: '💼', color: '#10b981', isDefault: true },
  { id: 'cat-freelance',   name: 'Freelance',   type: 'INCOME',  emoji: '💻', color: '#06b6d4', isDefault: true },
  { id: 'cat-invest',      name: 'Investimentos', type: 'INCOME', emoji: '📈', color: '#6366f1', isDefault: true },
  { id: 'cat-outros-inc',  name: 'Outros (receita)', type: 'INCOME', emoji: '💰', color: '#84cc16', isDefault: true },
]

interface Store {
  transactions: Transaction[]
  categories: Category[]
  goals: Goal[]
  recurring: RecurringTransaction[]

  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'source'>) => void
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  addCategory: (data: Omit<Category, 'id' | 'isDefault'>) => void
  deleteCategory: (id: string) => void

  addGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, data: Partial<Goal>) => void
  deleteGoal: (id: string) => void

  addRecurring: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'active' | 'nextDue'>) => void
  toggleRecurring: (id: string) => void
  deleteRecurring: (id: string) => void

  // Processa todos os recorrentes ativos e gera transações vencidas
  processRecurring: () => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      goals: [],
      recurring: [],

      addTransaction: (data) => {
        const cat = get().categories.find(c => c.id === data.categoryId)
        set(s => ({
          transactions: [
            { ...data, id: cuid(), createdAt: new Date().toISOString(), source: 'WEB', category: cat },
            ...s.transactions,
          ],
        }))
      },

      updateTransaction: (id, data) => {
        set(s => ({
          transactions: s.transactions.map(t => {
            if (t.id !== id) return t
            const cat = data.categoryId ? s.categories.find(c => c.id === data.categoryId) : t.category
            return { ...t, ...data, category: cat }
          }),
        }))
      },

      deleteTransaction: (id) =>
        set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

      addCategory: (data) =>
        set(s => ({
          categories: [...s.categories, { ...data, id: `cat-${cuid()}`, isDefault: false }],
        })),

      deleteCategory: (id) =>
        set(s => ({ categories: s.categories.filter(c => c.id !== id) })),

      addGoal: (data) =>
        set(s => ({
          goals: [...s.goals, { ...data, id: cuid(), createdAt: new Date().toISOString() }],
        })),

      updateGoal: (id, data) =>
        set(s => ({ goals: s.goals.map(g => (g.id === id ? { ...g, ...data } : g)) })),

      deleteGoal: (id) =>
        set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      addRecurring: (data) => {
        const cat = get().categories.find(c => c.id === data.categoryId)
        const id = cuid()
        const newRec: RecurringTransaction = {
          ...data,
          id,
          active: true,
          nextDue: data.startDate,
          createdAt: new Date().toISOString(),
          category: cat,
        }

        // Gera imediatamente as transações vencidas (incluindo hoje)
        const existingKeys = new Set(
          get().transactions
            .map(t => (t as any).recurringDedupKey)
            .filter(Boolean),
        )
        const { transactions: newTxs, nextDue } = generateDueTransactions(newRec, existingKeys)

        set(s => ({
          recurring: [{ ...newRec, nextDue }, ...s.recurring],
          transactions: [...newTxs, ...s.transactions],
        }))
      },

      toggleRecurring: (id) =>
        set(s => ({
          recurring: s.recurring.map(r => (r.id === id ? { ...r, active: !r.active } : r)),
        })),

      deleteRecurring: (id) =>
        set(s => ({
          recurring: s.recurring.filter(r => r.id !== id),
          transactions: s.transactions.filter(t => (t as any).recurringId !== id),
        })),

      processRecurring: () => {
        const { recurring, transactions } = get()
        const existingKeys = new Set(
          transactions.map(t => (t as any).recurringDedupKey).filter(Boolean),
        )

        const newTxs: Transaction[] = []
        const updatedRecurring = recurring.map(rec => {
          if (!rec.active) return rec
          const { transactions: generated, nextDue } = generateDueTransactions(rec, existingKeys)
          generated.forEach(t => {
            existingKeys.add((t as any).recurringDedupKey)
            newTxs.push(t)
          })
          return { ...rec, nextDue }
        })

        if (newTxs.length > 0 || updatedRecurring.some((r, i) => r.nextDue !== recurring[i].nextDue)) {
          set(s => ({
            recurring: updatedRecurring,
            transactions: [...newTxs, ...s.transactions],
          }))
        }
      },
    }),
    { name: 'financa-data' },
  ),
)
