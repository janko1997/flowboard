'use client'

// ---------------------------------------------------------------------------
// AppShell — composes TopNavBar + SideNavBar + main content area.
//
// Responsible for syncing the Zustand darkMode flag → <html class="dark">.
// useEffect runs whenever darkMode changes and applies/removes the class on
// document.documentElement. localStorage persistence is handled in uiSlice.
// ---------------------------------------------------------------------------

import { useEffect } from 'react'
import { useBoardStore } from '@/store'
import { TopNavBar } from './TopNavBar'
import { SideNavBar } from './SideNavBar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const darkMode    = useBoardStore(s => s.darkMode)
  const setDarkMode = useBoardStore(s => s.setDarkMode)

  // After hydration: read the real preference from localStorage / system and
  // sync it into the store. This runs only once — the toggle handles updates
  // from that point on. Keeping this out of the store init prevents the
  // server/client HTML mismatch that causes hydration errors.
  useEffect(() => {
    const stored = localStorage.getItem('flowboard-dark-mode')
    const preferred = stored !== null
      ? stored === 'true'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(preferred)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — runs once after mount

  // Apply / remove the 'dark' class whenever the store value changes.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className="flex h-full flex-col bg-surface">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavBar />
        <main className="flex flex-1 flex-col overflow-hidden bg-surface">
          {children}
        </main>
      </div>
    </div>
  )
}
