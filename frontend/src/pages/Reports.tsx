import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import dayjs from 'dayjs'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function Reports() {
  const { transactions, categories } = useStore()
  const now = dayjs()
  const [month, setMonth] = useState(now.month() + 1)
  const [year, setYear] = useState(now.year())

  const monthTxs = transactions.filter(t =>
    dayjs(t.date).month() + 1 === month && dayjs(t.date).year() === year
  )

  const income = monthTxs.filter(t => t.type === 'INCOME').reduce((a, t) => a + Number(t.amount), 0)
  const expense = monthTxs.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + Number(t.amount), 0)
  const balance = income - expense

  // Despesas por categoria
  const expenseByCategory = categories
    .filter(c => c.type === 'EXPENSE')
    .map(cat => {
      const total = monthTxs
        .filter(t => t.type === 'EXPENSE' && t.categoryId === cat.id)
        .reduce((a, t) => a + Number(t.amount), 0)
      return { name: `${cat.emoji} ${cat.name}`, value: total, color: cat.color }
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)

  // Evolução 6 meses
  const evolution = Array.from({ length: 6 }, (_, i) => {
    const d = now.subtract(5 - i, 'month')
    const txs = transactions.filter(t =>
      dayjs(t.date).month() === d.month() && dayjs(t.date).year() === d.year()
    )
    const inc = txs.filter(t => t.type === 'INCOME').reduce((a, t) => a + Number(t.amount), 0)
    const exp = txs.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + Number(t.amount), 0)
    return { month: d.format('MMM/YY'), income: inc, expense: exp }
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <div className="flex gap-2">
          <select className="input w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Receitas', value: income, color: 'text-green-600' },
          { label: 'Despesas', value: expense, color: 'text-red-500' },
          { label: 'Saldo', value: balance, color: balance >= 0 ? 'text-green-600' : 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>
              R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Gastos por categoria</h2>
          {expenseByCategory.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expenseByCategory.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                      <span>{c.name}</span>
                    </div>
                    <span className="font-medium">R$ {c.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Sem despesas neste mês.</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Receitas vs Despesas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
