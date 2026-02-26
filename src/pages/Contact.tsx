import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ROUTES } from '@/constants/routes'
import './Contact.css'

const CONTACT_EMAIL = 'thaimassagematch@hotmail.com'
const CANONICAL_CONTACT = 'https://massagematchthai.com/contact'

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact | MassageMatch Thailand</title>
        <meta
          name="description"
          content="Contact MassageMatch Thailand. Questions, feedback or business inquiries."
        />
        <link rel="canonical" href={CANONICAL_CONTACT} />
        <meta property="og:title" content="Contact | MassageMatch Thailand" />
        <meta property="og:url" content={CANONICAL_CONTACT} />
      </Helmet>
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
    </>
  )
}
