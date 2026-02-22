import React from 'react'
import './ErrorBoundary.css'

type Props = { children: React.ReactNode }

const FALLBACK = {
  sv: {
    title: 'Något gick fel',
    message: 'Försök ladda om sidan. Om felet kvarstår, kontakta thaimassagematch@hotmail.com.',
    retry: 'Försök igen',
  },
  th: {
    title: 'เกิดข้อผิดพลาด',
    message: 'ลองรีเฟรชหน้า หากยังมีปัญหา ติดต่อ thaimassagematch@hotmail.com',
    retry: 'ลองอีกครั้ง',
  },
  en: {
    title: 'Something went wrong',
    message: 'Try refreshing the page. If the problem continues, contact thaimassagematch@hotmail.com.',
    retry: 'Try again',
  },
} as const

function getLocale(): keyof typeof FALLBACK {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language?.toLowerCase() ?? ''
  if (lang.startsWith('sv')) return 'sv'
  if (lang.startsWith('th')) return 'th'
  return 'en'
}

export class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary', error, info)
  }

  render() {
    if (this.state.hasError) {
      const locale = getLocale()
      const t = FALLBACK[locale]
      return (
        <div className="error-fallback" role="alert">
          <div className="error-fallback-content">
            <h1 className="error-fallback-title">{t.title}</h1>
            <p className="error-fallback-message">{t.message}</p>
            <button
              type="button"
              className="error-fallback-btn"
              onClick={() => this.setState({ hasError: false })}
            >
              {t.retry}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
