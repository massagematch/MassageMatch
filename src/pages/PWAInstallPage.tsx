import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import PWAInstallBanner from '@/components/PWAInstallBanner'
import './PWAInstallPage.css'

export default function PWAInstallPage() {
  return (
    <div className="pwa-install-page">
      <PWAInstallBanner />
      <div className="pwa-install-page-content">
        <div className="pwa-install-page-hero">📱</div>
        <h1 className="pwa-install-page-title">Installera MassageMatch App</h1>
        <p className="pwa-install-page-subtitle">
          Snabbare laddning, push-notiser vid nya likes och fungerar bättre på Thailand 4G.
        </p>

        <section className="pwa-install-page-steps">
          <h2 className="pwa-install-page-steps-title">Hur gör du?</h2>
          <div className="pwa-install-step pwa-install-step-android">
            <span className="pwa-install-step-num">1</span>
            <div>
              <h3 className="pwa-install-step-heading">Android</h3>
              <p className="pwa-install-step-desc">Meny (⋮) → Lägg till på startskärmen</p>
            </div>
          </div>
          <div className="pwa-install-step pwa-install-step-ios">
            <span className="pwa-install-step-num">2</span>
            <div>
              <h3 className="pwa-install-step-heading">iPhone</h3>
              <p className="pwa-install-step-desc">Dela (📤) → Lägg till på hemskärmen</p>
            </div>
          </div>
        </section>

        <Link to={ROUTES.HOME} className="pwa-install-page-cta">
          Starta App
        </Link>
      </div>
    </div>
  )
}
