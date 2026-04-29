import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './hooks/useStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Categories from './pages/Categories'
import Goals from './pages/Goals'

export default function App() {
  const processRecurring = useStore(s => s.processRecurring)

  useEffect(() => {
    processRecurring()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="categories" element={<Categories />} />
          <Route path="goals" element={<Goals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
