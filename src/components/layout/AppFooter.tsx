import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function AppFooter() {
  const t = await getTranslations('nav')

  return (
    <footer className="border-t border-wismo-border bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-wismo-text-light order-2 sm:order-1">
          © {new Date().getFullYear()} WISMO
        </span>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 order-1 sm:order-2">
          <Link href="/privacy" className="text-sm text-wismo-text-light hover:text-wismo-text-muted transition-colors">
            {t('privacy_policy')}
          </Link>
          <Link href="/disclosure" className="text-sm text-wismo-text-light hover:text-wismo-text-muted transition-colors">
            {t('disclosure_policy')}
          </Link>
          <Link href="/usage-policy" className="text-sm text-wismo-text-light hover:text-wismo-text-muted transition-colors">
            {t('usage_policy')}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
