import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { Frequency } from '../types'
import { Plus, Trash2, X, RefreshCw, Pause, Play } from 'lucide-react'
import dayjs from 'dayjs'

const FREQ_LABEL: Record<Frequency, string> = {
  DAILY: 'Diário', WEEKLY: 'Semanal', MONTHLY: 'Mensal', YEARLY: 'Anual',
}
const FREQ_ICON: Record<Frequency, string> = {
  DAILY: '📆', WEEKLY: '📅', MONTHLY: '🗓️', YEARLY: '📇',
}

type FormState = {
  type: 'INCOME' | 'EXPENSE'
  amount: string
  description: string
  categoryId: string
  frequency: Frequency
  startDate: string
  endDate: string
}

const emptyForm = (): FormState => ({
  type: 'EXPENSE', amount: '', description: '', categoryId: '',
  frequency: 'MONTHLY', startDate: dayjs().format('YYYY-MM-DD'), endDate: '',
})

export default function Recurring() {
  const { recurring, categories, addRecurring, toggleRecurring, deleteRecurring } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())

  function save() {
    if (!form.amount || !form.description) return
    addRecurring({
      type: form.type,
      amount: Number(form.amount),
      description: form.description,
      categoryId: form.categoryId || undefined,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
    })
    setShowModal(false)
    setForm(emptyForm())
  }

  const active = recurring.filter(r => r.active)
  const inactive = recurring.filter(r => !r.active)
  const filteredCats = categories.filter(c => c.type === form.type)

  const monthlyTotal = active.filter(r => r.type === 'EXPENSE').reduce((acc, r) => {
    const v = Number(r.amount)
    if (r.frequency === 'MONTHLY') return acc + v
    if (r.frequency === 'YEARLY')  return acc + v / 12
    if (r.frequency === 'WEEKLY')  return acc + v * 4.33
    if (r.frequency === 'DAILY')   return acc + v * 30
    return acc
  }, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Recorrentes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lançamentos automáticos periódicos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo recorrente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{active.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Custo mensal estimado</p>
          <p className="text-3xl font-bold text-red-500 mt-1">
            R$ {monthlyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pausados</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">{inactive.length}</p>
        </div>
      </div>

      {active.length === 0 && inactive.length === 0 ? (
        <div className="card text-center py-12">
          <RefreshCw size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Nenhum recorrente cadastrado ainda.</p>
          <p className="text-xs text-gray-300 mt-1">Ex: aluguel, Netflix, conta de luz</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Ativos</h2>
              <div className="divide-y divide-gray-50">
                {active.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.category?.emoji || (r.type === 'INCOME' ? '💰' : '💸')}</span>
                      <div>
                        <p className="text-sm font-medium">{r.description}</p>
                        <p className="text-xs text-gray-400">
                          {r.category?.name && `${r.category.name} • `}
                          {FREQ_ICON[r.frequency as Frequency]} {FREQ_LABEL[r.frequency as Frequency]}
                          {' • Início: '}{dayjs(r.startDate).format('DD/MM/YYYY')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold text-sm ${r.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                        {r.type === 'INCOME' ? '+' : '-'} R$ {Number(r.amount).toFixed(2)}
                      </span>
                      <button onClick={() => toggleRecurring(r.id)} title="Pausar"
                        className="text-gray-300 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pause size={14} />
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

          {inactive.length > 0 && (
            <div className="card opacity-60">
              <h2 className="font-semibold text-gray-600 mb-4">Pausados</h2>
              <div className="divide-y divide-gray-50">
                {inactive.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{r.category?.emoji || '💸'}</span>
                      <div>
                        <p className="text-sm font-medium">{r.description}</p>
                        <p className="text-xs text-gray-400">
                          {FREQ_ICON[r.frequency as Frequency]} {FREQ_LABEL[r.frequency as Frequency]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-gray-400">
                        R$ {Number(r.amount).toFixed(2)}
                      </span>
                      <button onClick={() => toggleRecurring(r.id)} title="Reativar"
                        className="text-gray-300 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={14} />
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
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Novo lançamento recorrente</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['EXPENSE', 'INCOME'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t, categoryId: '' }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                    {t === 'EXPENSE' ? '💸 Gasto' : '💰 Receita'}
                  </button>
                ))}
              </div>

              <input className="input" placeholder="Descrição (ex: Aluguel, Netflix...)"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              <input className="input" type="number" placeholder="Valor (R$)"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(FREQ_LABEL) as Frequency[]).map(f => (
                    <button key={f} onClick={() => setForm(fm => ({ ...fm, frequency: f }))}
                      className={`py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
                        form.frequency === f
                          ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      <span>{FREQ_ICON[f]}</span>
                      <span>{FREQ_LABEL[f]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <select className="input" value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">Categoria (opcional)</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
                <input className="input" type="date" value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de fim (opcional)</label>
                <input className="input" type="date" value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>

              <button className="btn-primary w-full py-3" onClick={save}
                disabled={!form.amount || !form.description}>
                Criar recorrente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
