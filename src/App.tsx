import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { CostCalculator } from './pages/CostCalculator'
import { CostEditor } from './pages/CostEditor'
import { Settings } from './pages/Settings'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toaster } from './components/Toaster'
import { useUI } from './store/useUI'
import { useApplyTheme } from './hooks/useTheme'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/cost" element={<CostCalculator />} />
          <Route path="/projects/:id/cost/:calcId" element={<CostEditor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  useApplyTheme()
  const confirm = useUI((s) => s.confirm)
  const closeConfirm = useUI((s) => s.closeConfirm)

  return (
    <BrowserRouter>
      <Layout>
        <AnimatedRoutes />
      </Layout>
      <Toaster />
      <ConfirmDialog state={confirm} onClose={closeConfirm} />
    </BrowserRouter>
  )
}
