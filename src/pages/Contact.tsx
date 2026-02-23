import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import './Contact.css'

const CONTACT_EMAIL = 'thaimassagematch@hotmail.com'

export default function Contact() {
  return (
    <div className="contact-page">
      <div className="contact-card">
        <h1>Contact us</h1>
        <p className="contact-text">
          Questions, feedback or business inquiries? Reach out and we&apos;ll get back to you.
        </p>
        <p className="contact-email-wrap">
          <a href={`mailto:${CONTACT_EMAIL}`} className="contact-email">
            {CONTACT_EMAIL}
          </a>
        </p>
        <Link to={ROUTES.LOGIN} className="contact-back">
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
