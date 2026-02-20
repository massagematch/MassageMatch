import { FAQSchemaMarkup } from '@/components/SchemaMarkup'
import './FAQ.css'

const faqs = [
  {
    question: 'How much does MassageMatch Thailand cost?',
    answer: 'We offer free daily swipes (5 per day). Premium plans start at 49 THB for unlocking a profile, or 199 THB for 12 hours of unlimited swipes. Therapists can get FREE 3-month Premium with promo code NEWTHERAPIST90.',
  },
  {
    question: 'How do I unlock a therapist profile?',
    answer: 'Click "Unlock Profile" (49 THB) to get direct contact with a therapist for 1 hour. This allows you to message them and book appointments.',
  },
  {
    question: 'What is the therapist FREE promo code?',
    answer: 'New therapists can use code NEWTHERAPIST90 to get 3 months of FREE Premium access, including toplist visibility and swipe priority.',
  },
  {
    question: 'How do boosts work?',
    answer: 'Boosts increase your visibility in search results. Swipe Boost (199 THB) gives 5x visibility for 6 hours. Search Boost (149 THB) puts you at #1 position for 24 hours.',
  },
  {
    question: 'Can I use MassageMatch offline?',
    answer: 'Yes! Install our PWA app and you can swipe therapists offline. Your swipes sync when you reconnect.',
  },
]

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
    </div>
  )
}
