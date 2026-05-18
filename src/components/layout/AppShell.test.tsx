import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell, useAppShell } from '@/components/layout/AppShell'

function ShellProbe() {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useAppShell()

  return (
    <div>
      <span>{isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}</span>
      <button onClick={toggleSidebar} type="button">
        Toggle sidebar
      </button>
      <button onClick={closeSidebar} type="button">
        Close sidebar
      </button>
    </div>
  )
}

describe('AppShell', () => {
  it('toggles and closes sidebar', () => {
    render(
      <AppShell>
        <ShellProbe />
      </AppShell>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(screen.getByText('sidebar-open')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar' }))
    expect(screen.getByText('sidebar-closed')).toBeTruthy()
  })
})
