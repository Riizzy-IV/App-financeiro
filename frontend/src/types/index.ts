export interface User {
  id: string
  name: string
  email?: string
  phone: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  emoji: string
  color: string
  isDefault: boolean
}

export interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  date: string
  source: 'WEB' | 'WHATSAPP'
  category?: Category
  categoryId?: string
  recurringId?: string
  recurringDedupKey?: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  createdAt: string
}

export interface DashboardData {
  income: number
  expense: number
  balance: number
  totalTransactions: number
  recentTransactions: Transaction[]
  goals: Goal[]
}

export interface MonthlyReport {
  income: number
  expense: number
  balance: number
  byCategory: {
    categoryId: string | null
    type: string
    total: number
    category: Category | null
    _sum: { amount: number }
  }[]
}

export interface EvolutionData {
  month: string
  income: number
  expense: number
  balance: number
}

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface RecurringTransaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  frequency: Frequency
  startDate: string
  endDate?: string
  nextDue: string
  active: boolean
  category?: Category
  categoryId?: string
  createdAt: string
}
