'use client'

import { useEffect, useRef } from 'react'

interface GoogleOAuthButtonProps {
  /** Called with the GIS credential (ID token) when user signs in. */
  onCredential: (credential: string) => void
  /** Unused in the real implementation (GIS renders its own localised text),
   *  kept so test mocks can render a label. */
  label?: string
}

/**
 * Renders a full-width Google Sign-In button via GIS renderButton().
 * GIS handles the popup/FedCM flow and returns a credential (ID token),
 * forwarded to onCredential → useAuth.googleLogin → BFF POST /api/accounts/google/login.
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.
 */
export function GoogleOAuthButton({ onCredential, label: _label }: GoogleOAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    let timer: ReturnType<typeof setTimeout>

    const render = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: containerRef.current.offsetWidth || 400,
      })
    }

    if (window.google?.accounts?.id) {
      timer = setTimeout(render, 0)
    } else {
      const onLoad = () => { timer = setTimeout(render, 0) }
      window.addEventListener('gis-loaded', onLoad, { once: true })
      return () => {
        window.removeEventListener('gis-loaded', onLoad)
        clearTimeout(timer)
      }
    }

    return () => clearTimeout(timer)
  }, [onCredential])

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null

  return <div ref={containerRef} className="w-full flex justify-center" />
}
