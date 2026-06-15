import { NavLink, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, FolderKanban, Settings } from 'lucide-react'
import { cn } from './ui'

const tabs = [
  { to: '/', label: 'Ballina', icon: LayoutGrid, end: true },
  { to: '/projects', label: 'Projektet', icon: FolderKanban, end: false },
  { to: '/settings', label: 'Cilësimet', icon: Settings, end: false },
]

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <div className="app-bg relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col">
      <main className="flex-1 px-4 pb-28 pt-safe sm:px-6">{children}</main>
      <BottomNav pathname={location.pathname} />
    </div>
  )
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-3xl px-4 pb-safe">
      <div className="glass mb-2 flex items-center justify-around rounded-2xl border border-border p-1.5 shadow-soft">
        {tabs.map((tab) => {
          const active = tab.end ? pathname === tab.to : pathname.startsWith(tab.to)
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-primary/12"
                  transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                />
              )}
              <Icon
                size={22}
                className={cn(
                  'relative transition-colors',
                  active ? 'text-primary' : 'text-subtle'
                )}
              />
              <span
                className={cn('relative transition-colors', active ? 'text-primary' : 'text-subtle')}
              >
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
