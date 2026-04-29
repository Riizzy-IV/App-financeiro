import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { Plus, Trash2, X } from 'lucide-react'

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280']
const EMOJIS = ['💰','💸','🏠','🚗','🍔','🎮','👕','📚','🏥','✈️','💼','💻','📈','🎵','🏋️','🐶']

export default function Categories() {
  const { categories, addCategory, deleteCategory } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE', emoji: '💸', color: '#ef4444' })

  function save() {
    if (!form.name) return
    addCategory(form)
    setShowModal(false)
    setForm({ name: '', type: 'EXPENSE', emoji: '💸', color: '#ef4444' })
  }

  const expense = categories.filter(c => c.type === 'EXPENSE')
  const income = categories.filter(c => c.type === 'INCOME')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova categoria
        </button>
      </div>

      {[{ label: 'Despesas', items: expense }, { label: 'Receitas', items: income }].map(({ label, items }) => (
        <div key={label} className="card">
          <h2 className="font-semibold text-gray-800 mb-4">{label}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 group">
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  <div className="w-3 h-3 rounded-full mt-0.5" style={{ background: cat.color }} />
                </div>
                {!cat.isDefault && (
                  <button onClick={() => deleteCategory(cat.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Nova categoria</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['EXPENSE', 'INCOME'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                      form.type === t
                        ? t === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                    {t === 'EXPENSE' ? 'Despesa' : 'Receita'}
                  </button>
                ))}
              </div>
              <input className="input" placeholder="Nome da categoria" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className={`text-xl p-1.5 rounded-lg ${form.emoji === e ? 'bg-green-100 ring-2 ring-green-400' : 'hover:bg-gray-100'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cor</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <button className="btn-primary w-full py-3" onClick={save} disabled={!form.name}>
                Criar categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
