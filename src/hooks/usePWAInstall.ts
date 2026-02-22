import { useState, useEffect } from 'react'

const STORAGE_KEY = 'pwa_install_dismissed'

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<{
    prompt: () => Promise<void>
    userChoice?: Promise<{ outcome: string }>
  } | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    if (standalone) {
      setIsInstalled(true)
      return
    }
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      const ev = e as { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> }
      if (typeof ev.prompt === 'function') setDeferredPrompt(ev)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      localStorage.setItem(STORAGE_KEY, '1')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const installPWA = async () => {
    if (!deferredPrompt?.prompt) return
    try {
      await deferredPrompt.prompt()
      const choice = deferredPrompt.userChoice ? await deferredPrompt.userChoice : { outcome: 'dismissed' }
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstalled(true)
        localStorage.setItem(STORAGE_KEY, '1')
      }
    } catch {
      setDeferredPrompt(null)
    }
  }

  const showInstallButton = Boolean(deferredPrompt && !isInstalled)

  return { showInstallButton, installPWA, isInstalled }
}
