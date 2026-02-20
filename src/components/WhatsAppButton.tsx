import { useState } from 'react'
import './WhatsAppButton.css'

interface WhatsAppButtonProps {
  phoneNumber?: string
  message?: string
  therapistName?: string
}

export function WhatsAppButton({ phoneNumber, message, therapistName }: WhatsAppButtonProps) {
  const [show, setShow] = useState(true)

  if (!show || !phoneNumber) return null

  const defaultMessage = therapistName
    ? `Hi ${therapistName}, I'd like to book a massage session through MassageMatch Thailand.`
    : 'Hi, I\'d like to book a massage session through MassageMatch Thailand.'
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message || defaultMessage)}`

  return (
    <div className="whatsapp-button-container">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-button"
        onClick={() => {
          // Track WhatsApp click
          if (window.posthog) {
            window.posthog.capture('whatsapp_click', { therapist: therapistName })
          }
        }}
      >
        <span className="whatsapp-icon">💬</span>
        <span className="whatsapp-text">Book via WhatsApp</span>
      </a>
    </div>
  )
}
