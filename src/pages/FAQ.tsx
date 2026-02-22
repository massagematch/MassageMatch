import { FAQSchemaMarkup } from '@/components/SchemaMarkup'
import './FAQ.css'

const legalId = 'legal'

const faqs = [
  {
    question: 'How much does MassageMatch Thailand cost?',
    answer: 'We offer free daily swipes (5 per day). Premium plans start at 49 THB for unlocking a profile, or 199 THB for 12 hours of unlimited swipes. Therapists/freelancers can get FREE 3-month Premium with promo code NEWTHERAPIST90.',
  },
  {
    question: 'How do I unlock a therapist/freelance profile?',
    answer: 'Click "Unlock Profile" (49 THB) to get direct contact with a therapist/freelance for 1 hour. This allows you to message them and book appointments.',
  },
  {
    question: 'What is the therapist/freelance FREE promo code?',
    answer: 'New therapists/freelancers can use code NEWTHERAPIST90 to get 3 months of FREE Premium access, including toplist visibility and swipe priority. A timer on your Profile shows when it expires; after that you must pay Premium to appear in swipe/search.',
  },
  {
    question: 'How do boosts work?',
    answer: 'Boosts increase your visibility in search results. Swipe Boost (199 THB) gives 5x visibility for 6 hours. Search Boost (149 THB) puts you at #1 position for 24 hours.',
  },
  {
    question: 'Can I use MassageMatch offline?',
    answer: 'Yes! Install our PWA app and you can swipe therapists/freelancers offline. Your swipes sync when you reconnect.',
  },
]

const legalSection = (
  <section id={legalId} className="faq-legal">
    <h2>Regler & Användaransvar</h2>
    <p><strong>Genom registrering godkänner du:</strong></p>
    <ol>
      <li>Följa Thai lag (licens, <strong>inga sexuella tjänster</strong>).</li>
      <li>Therapists/freelancers/salonger ansvarar för allt.</li>
      <li>Kunder: Endast legal massage.</li>
      <li>MassageMatch = matchmaking, <strong>ej ansvarig</strong>.</li>
    </ol>
    <p>Rapportera: <a href="mailto:thaimassagematch@hotmail.com">thaimassagematch@hotmail.com</a></p>
    <p><strong>SV:</strong> Alla ansvarar för licens/lag. Inga sexuella tjänster. Plattform ej ansvarig.</p>
  </section>
)

export default function FAQ() {
  return (
    <div className="faq-page">
      <h1>Frequently Asked Questions</h1>
      <FAQSchemaMarkup data={{ questions: faqs }} />
      <div className="faq-list">
        {faqs.map((faq, idx) => (
          <div key={idx} className="faq-item">
            <h3 className="faq-question">{faq.question}</h3>
            <p className="faq-answer">{faq.answer}</p>
          </div>
        ))}
      </div>
      {legalSection}
    </div>
  )
}
