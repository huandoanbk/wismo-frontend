import { useAppShell } from '@/components/layout/AppShell'

/**
 * Header button for opening the mobile sidebar overlay.
 */
export function MobileMenuButton() {
  const { isSidebarOpen, toggleSidebar } = useAppShell()

  return (
    <button
      aria-expanded={isSidebarOpen}
      aria-label="Mở menu"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-wismo-border bg-white text-wismo-text shadow-sm transition hover:border-wismo-primary md:hidden"
      onClick={toggleSidebar}
      type="button"
    >
      ☰
    </button>
  )
}
