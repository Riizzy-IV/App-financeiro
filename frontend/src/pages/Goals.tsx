import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { Plus, Trash2, X, Target, Pencil } from 'lucide-react'
import dayjs from 'dayjs'

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '0', deadline: '' })

  function openNew() {
    setEditingId(null)
    setForm({ name: '', targetAmount: '', currentAmount: '0', deadline: '' })
    setShowModal(true)
  }

  function openEdit(id: string) {
    const g = goals.find(g => g.id === id)!
    setEditingId(id)
    setForm({
      name: g.name,
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      deadline: g.deadline ? dayjs(g.deadline).format('YYYY-MM-DD') : '',
    })
    setShowModal(true)
  }

  function save() {
    if (!form.name || !form.targetAmount) return
    const data = {
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount),
      deadline: form.deadline || undefined,
    }
    if (editingId) {
      updateGoal(editingId, data)
    } else {
      addGoal(data)
    }
    setShowModal(false)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Metas Financeiras</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova meta
        </button>
      </div>

      {!goals.length ? (
        <div className="card text-center py-12">
          <Target size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">Nenhuma meta ainda. Crie sua primeira meta!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => {
            const pct = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100)
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
            return (
              <div key={goal.id} className="card group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">{goal.name}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(goal.id)} className="text-gray-300 hover:text-blue-500">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progresso</span>
                    <span className="font-medium text-green-600">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full">
                    <div className="h-3 bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Acumulado</span>
                    <span className="font-medium">R$ {Number(goal.currentAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Meta</span>
                    <span className="font-medium">R$ {Number(goal.targetAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Falta</span>
                    <span className="font-medium text-red-500">R$ {remaining.toFixed(2)}</span>
                  </div>
                  {goal.deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Prazo</span>
                      <span className="font-medium">{dayjs(goal.deadline).format('DD/MM/YYYY')}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editingId ? 'Editar meta' : 'Nova meta'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <input className="input" placeholder="Nome da meta (ex: Viagem, Carro...)" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="input" type="number" placeholder="Valor alvo (R$)" value={form.targetAmount}
                onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} />
              <input className="input" type="number" placeholder="Valor atual (R$)" value={form.currentAmount}
                onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (opcional)</label>
                <input className="input" type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <button className="btn-primary w-full py-3" onClick={save}
                disabled={!form.name || !form.targetAmount}>
                {editingId ? 'Salvar alterações' : 'Criar meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
