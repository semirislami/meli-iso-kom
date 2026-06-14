import { useEffect } from 'react'
import { useSettings } from '../store/useSettings'

/** Keeps the <html> `dark` class in sync with the theme setting. */
export function useApplyTheme() {
  const theme = useSettings((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const mql = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mql.matches)
      root.classList.toggle('dark', dark)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', dark ? '#0b0b0f' : '#f7f7f9')
    }

    apply()
    if (theme === 'system') {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }
  }, [theme])
}
