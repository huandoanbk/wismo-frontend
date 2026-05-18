'use client'

import { useEffect } from 'react'

interface GoogleOneTapProps {
  /** Called with the GIS credential (ID token) when user approves One Tap. */
  onCredential: (credential: string) => void
}

/**
 * Renders nothing — triggers Google One Tap prompt when GIS script is ready.
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID env var and the GIS script loaded in layout.
 *
 * Uses setTimeout(0) so React StrictMode cleanup can clearTimeout before the prompt
 * fires, preventing concurrent FedCM requests (NotAllowedError).
 * cancel() is only called if prompt() actually fired, avoiding spurious AbortErrors.
 */
export function GoogleOneTap({ onCredential }: GoogleOneTapProps) {
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    let timer: ReturnType<typeof setTimeout>
    let promptFired = false

    const run = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      })
      window.google.accounts.id.prompt()
      promptFired = true
    }

    if (window.google?.accounts?.id) {
      timer = setTimeout(run, 0)
    } else {
      const onLoad = () => { timer = setTimeout(run, 0) }
      window.addEventListener('gis-loaded', onLoad, { once: true })
      return () => {
        window.removeEventListener('gis-loaded', onLoad)
        clearTimeout(timer)
      }
    }

    return () => {
      clearTimeout(timer)
      if (promptFired) {
        window.google?.accounts?.id?.cancel()
      }
    }
  }, [onCredential])

  return null
}
