import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, BarChart2, Tag, Target } from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/reports', icon: BarChart2, label: 'Relatórios' },
  { to: '/categories', icon: Tag, label: 'Categorias' },
  { to: '/goals', icon: Target, label: 'Metas' },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-green-600">💰 Finança</h1>
          <p className="text-xs text-gray-500 mt-1">Gestão Financeira</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Dados salvos localmente no navegador</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
