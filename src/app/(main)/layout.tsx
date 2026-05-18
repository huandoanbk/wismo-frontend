import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-wismo-bg">
      <AppHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <AppFooter />
    </div>
  )
}
