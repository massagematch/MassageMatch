import { usePWAInstall } from '@/hooks/usePWAInstall'
import './PWAInstallBanner.css'

export default function PWAInstallBanner() {
  const { showInstallButton, installPWA } = usePWAInstall()

  if (!showInstallButton) return null

  return (
    <div className="pwa-install-banner" role="dialog" aria-label="Installera app">
      <div className="pwa-install-banner-inner">
        <div className="pwa-install-banner-icon" aria-hidden>📱</div>
        <div className="pwa-install-banner-text">
          <h3 className="pwa-install-banner-title">Lägg till som app!</h3>
          <p className="pwa-install-banner-desc">Push-notiser & snabbare laddning</p>
        </div>
        <button
          type="button"
          className="pwa-install-banner-btn"
          onClick={installPWA}
        >
          Installera
        </button>
      </div>
    </div>
  )
}
