import { useState, useEffect } from 'react'
import './PWAInstallPrompt.css'

const STORAGE_KEY = 'pwa_install_dismissed'

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) return
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> })
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setShow(false)
      setDeferredPrompt(null)
      localStorage.setItem(STORAGE_KEY, '1')
    }
  }

  function handleDismiss() {
    setShow(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  if (!show) return null

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-inner">
        <p className="pwa-install-title">Lägg till hemskärm</p>
        <p className="pwa-install-desc">
          {isIOS
            ? 'Tryck på Dela-knappen och välj "Lägg till på hemskärmen".'
            : 'Installera appen för snabbare åtkomst.'}
        </p>
        <div className="pwa-install-actions">
          {!isIOS && deferredPrompt && (
            <button type="button" className="btn-pwa-install" onClick={handleInstall}>
              Installera
            </button>
          )}
          <button type="button" className="btn-pwa-dismiss" onClick={handleDismiss}>
            Inte nu
          </button>
        </div>
      </div>
    </div>
  )
}
