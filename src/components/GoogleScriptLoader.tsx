'use client'

import { useEffect } from 'react'
import Script from 'next/script'

/** Suppresses known GIS internal console.error noise in development. */
function useGISErrorFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const original = console.error.bind(console)
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('GSI_LOGGER')) return
      original(...args)
    }
    return () => { console.error = original }
  }, [])
}

/** Loads Google Identity Services script and signals when ready via 'gis-loaded' event. */
export function GoogleScriptLoader() {
  useGISErrorFilter()
  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => window.dispatchEvent(new Event('gis-loaded'))}
    />
  )
}
