'use client'

import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react'

interface AppShellContextValue {
  isSidebarOpen: boolean
  closeSidebar: () => void
  toggleSidebar: () => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export interface AppShellProps extends PropsWithChildren {
  children: React.ReactNode
}

/**
 * Root shell for the mock chat layout.
 */
export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <AppShellContext.Provider
      value={{
        isSidebarOpen,
        closeSidebar: () => setIsSidebarOpen(false),
        toggleSidebar: () => setIsSidebarOpen(current => !current),
      }}
    >
      <div className="fixed inset-0 flex h-dvh overflow-hidden overscroll-none bg-wismo-bg text-wismo-text text-base leading-7">
        {children}
      </div>
    </AppShellContext.Provider>
  )
}

/**
 * Shared UI shell state for sidebar overlay and calm mode.
 */
export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within AppShell')
  }

  return context
}
