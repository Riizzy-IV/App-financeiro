import { useStore } from '../hooks/useStore'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

dayjs.locale('pt-br')

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: any; color: string; sub?: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold mt-0.5">
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { transactions, goals } = useStore()

  const now = dayjs()
  const monthTxs = transactions.filter(t =>
    dayjs(t.date).month() === now.month() && dayjs(t.date).year() === now.year()
  )

  const income = monthTxs.filter(t => t.type === 'INCOME').reduce((a, t) => a + Number(t.amount), 0)
  const expense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + Number(t.amount), 0)
  const balance = income - expense

  // Evolução últimos 6 meses
  const evolution = Array.from({ length: 6 }, (_, i) => {
    const d = now.subtract(5 - i, 'month')
    const txs = transactions.filter(t =>
      dayjs(t.date).month() === d.month() && dayjs(t.date).year() === d.year()
    )
    const inc = txs.filter(t => t.type === 'INCOME').reduce((a, t) => a + Number(t.amount), 0)
    const exp = txs.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + Number(t.amount), 0)
    return { month: d.format('MMM/YY'), income: inc, expense: exp, balance: inc - exp }
  })

  const recent = [...transactions].sort((a, b) => dayjs(b.date).diff(dayjs(a.date))).slice(0, 5)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm capitalize mt-1">{now.format('MMMM [de] YYYY')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Saldo" value={balance} icon={Wallet}
          color={balance >= 0 ? 'bg-green-500' : 'bg-red-500'} sub="Mês atual" />
        <StatCard label="Receitas" value={income} icon={TrendingUp} color="bg-blue-500" />
        <StatCard label="Despesas" value={expense} icon={TrendingDown} color="bg-red-400" />
        <div className="card flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500">
            <ArrowLeftRight size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Transações</p>
            <p className="text-2xl font-bold mt-0.5">{monthTxs.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Este mês</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Evolução dos últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Legend />
              <Area type="monotone" dataKey="income" name="Receitas" stroke="#22c55e" fill="url(#income)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" fill="url(#expense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Metas</h2>
          {goals.length ? (
            <div className="space-y-4">
              {goals.slice(0, 4).map(goal => {
                const pct = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100)
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">{goal.name}</span>
                      <span className="text-gray-500 ml-2 shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      R$ {Number(goal.currentAmount).toFixed(2)} / R$ {Number(goal.targetAmount).toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhuma meta cadastrada.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Últimas transações</h2>
        {recent.length ? (
          <div className="divide-y divide-gray-50">
            {recent.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tx.category?.emoji || '💸'}</span>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-gray-400">
                      {tx.category?.name} • {dayjs(tx.date).format('DD/MM/YYYY')}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Nenhuma transação ainda. Adicione uma na aba Transações!</p>
        )}
      </div>
    </div>
  )
}
