import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { Transaction, Frequency } from '../types'
import { Plus, Trash2, Pencil, X, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'

const FREQ_OPTIONS: { value: Frequency; label: string; icon: string }[] = [
  { value: 'DAILY',   label: 'Diário',   icon: '📆' },
  { value: 'WEEKLY',  label: 'Semanal',  icon: '📅' },
  { value: 'MONTHLY', label: 'Mensal',   icon: '🗓️' },
  { value: 'YEARLY',  label: 'Anual',    icon: '📇' },
]

const FREQ_LABEL: Record<Frequency, string> = {
  DAILY: 'Diário', WEEKLY: 'Semanal', MONTHLY: 'Mensal', YEARLY: 'Anual',
}

type FormState = {
  type: 'INCOME' | 'EXPENSE'
  amount: string
  description: string
  categoryId: string
  date: string
  isRecurring: boolean
  frequency: Frequency
  endDate: string
}

const emptyForm = (): FormState => ({
  type: 'EXPENSE',
  amount: '',
  description: '',
  categoryId: '',
  date: dayjs().format('YYYY-MM-DD'),
  isRecurring: false,
  frequency: 'MONTHLY',
  endDate: '',
})

export default function Transactions() {
  const { transactions, recurring, categories, addTransaction, updateTransaction, deleteTransaction, addRecurring, toggleRecurring, deleteRecurring } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setShowModal(true)
  }

  function openEdit(tx: Transaction) {
    setEditing(tx)
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      description: tx.description,
      categoryId: tx.categoryId || '',
      date: dayjs(tx.date).format('YYYY-MM-DD'),
      isRecurring: false,
      frequency: 'MONTHLY',
      endDate: '',
    })
    setShowModal(true)
  }

  function save() {
    if (!form.amount || !form.description) return

    if (form.isRecurring && !editing) {
      addRecurring({
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        categoryId: form.categoryId || undefined,
        frequency: form.frequency,
        startDate: form.date,
        endDate: form.endDate || undefined,
      })
    } else {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        categoryId: form.categoryId || undefined,
        date: form.date,
      }
      if (editing) {
        updateTransaction(editing.id, payload)
      } else {
        addTransaction(payload)
      }
    }
    setShowModal(false)
    setEditing(null)
  }

  const filteredCats = categories.filter(c => c.type === form.type)
  const sortedTxs = [...transactions].sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
  const activeRecurring = recurring.filter(r => r.active)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova transação
        </button>
      </div>

      {/* Recorrentes ativos */}
      {activeRecurring.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-green-600" />
            <h2 className="font-semibold text-gray-800">Recorrentes ativos</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
              {activeRecurring.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activeRecurring.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2.5 group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{r.category?.emoji || (r.type === 'INCOME' ? '💰' : '💸')}</span>
                  <div>
                    <p className="text-sm font-medium">{r.description}</p>
                    <p className="text-xs text-gray-400">
                      {r.category?.name && `${r.category.name} • `}
                      {FREQ_LABEL[r.frequency as Frequency]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${r.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                    {r.type === 'INCOME' ? '+' : '-'} R$ {Number(r.amount).toFixed(2)}
                  </span>
                  <button onClick={() => toggleRecurring(r.id)} title="Pausar"
                    className="text-xs text-gray-300 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Pausar
                  </button>
                  <button onClick={() => deleteRecurring(r.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de transações */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Histórico</h2>
        {sortedTxs.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhuma transação ainda.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedTxs.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tx.category?.emoji || '💸'}</span>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-gray-400">
                      {tx.category?.name || '—'} • {dayjs(tx.date).format('DD/MM/YYYY')}
                      {tx.recurringId && <span className="ml-1 text-green-500">↻</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                  </span>
                  <button onClick={() => openEdit(tx)} className="text-gray-400 hover:text-blue-500">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => deleteTransaction(tx.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center p-6 pb-0">
              <h2 className="text-lg font-semibold">
                {editing ? 'Editar transação' : 'Nova transação'}
              </h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo */}
              <div className="flex gap-2">
                {(['EXPENSE', 'INCOME'] as const).map(t => (
                  <button key={t}
                    onClick={() => setForm(f => ({ ...f, type: t, categoryId: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                    {t === 'EXPENSE' ? '💸 Gasto' : '💰 Receita'}
                  </button>
                ))}
              </div>

              <input className="input" placeholder="Descrição" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              <input className="input" type="number" placeholder="Valor (R$)" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

              <select className="input" value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">Categoria (opcional)</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>

              <input className="input" type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

              {/* Toggle recorrente */}
              {!editing && (
                <button
                  onClick={() => setForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    form.isRecurring
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  <RefreshCw size={16} className={form.isRecurring ? 'text-green-600' : 'text-gray-400'} />
                  <span>Lançamento recorrente</span>
                  <span className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    form.isRecurring ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {form.isRecurring && <span className="w-2 h-2 bg-white rounded-full" />}
                  </span>
                </button>
              )}

              {/* Opções de recorrência */}
              {form.isRecurring && !editing && (
                <div className="space-y-3 pl-1">
                  <div className="grid grid-cols-4 gap-2">
                    {FREQ_OPTIONS.map(f => (
                      <button key={f.value}
                        onClick={() => setForm(fm => ({ ...fm, frequency: f.value }))}
                        className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                          form.frequency === f.value
                            ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        <span>{f.icon}</span>
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data de encerramento (opcional)</label>
                    <input className="input" type="date" value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
              )}

              <button className="btn-primary w-full py-3" onClick={save}
                disabled={!form.amount || !form.description}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
