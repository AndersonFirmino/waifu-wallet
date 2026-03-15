import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { LocaleProvider } from './hooks/useLocale'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import FixedExpenses from './pages/FixedExpenses'
import Debts from './pages/Debts'
import CreditCards from './pages/CreditCards'
import Calendar from './pages/Calendar'
import Forecast from './pages/Forecast'
import Gacha from './pages/Gacha'
import Notes from './pages/Notes'
import SalaryPlans from './pages/SalaryPlans'
import Savings from './pages/Savings'
import Settings from './pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="fixed-expenses" element={<FixedExpenses />} />
              <Route path="debts" element={<Debts />} />
              <Route path="credit-cards" element={<CreditCards />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="forecast" element={<Forecast />} />
              <Route path="gacha" element={<Gacha />} />
              <Route path="notes" element={<Notes />} />
              <Route path="salary" element={<SalaryPlans />} />
              <Route path="savings" element={<Savings />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocaleProvider>
    </ThemeProvider>
  )
}
