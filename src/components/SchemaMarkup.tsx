import { useEffect } from 'react'

interface LocalBusinessSchema {
  name: string
  description: string
  image?: string
  address?: {
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  telephone?: string
  priceRange?: string
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
}

interface FAQSchema {
  questions: Array<{
    question: string
    answer: string
  }>
}

export function LocalBusinessSchemaMarkup({ data }: { data: LocalBusinessSchema }) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: data.name,
      description: data.description,
      ...(data.image && { image: data.image }),
      ...(data.address && {
        address: {
          '@type': 'PostalAddress',
          ...data.address,
        },
      }),
      ...(data.telephone && { telephone: data.telephone }),
      ...(data.priceRange && { priceRange: data.priceRange }),
      ...(data.aggregateRating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.aggregateRating.ratingValue,
          reviewCount: data.aggregateRating.reviewCount,
        },
      }),
    }

    injectSchema(schema)
  }, [data])

  return null
}

export function FAQSchemaMarkup({ data }: { data: FAQSchema }) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: data.questions.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.answer,
        },
      })),
    }

    injectSchema(schema)
  }, [data])

  return null
}

function injectSchema(schema: Record<string, unknown>) {
  const scriptId = `schema-${JSON.stringify(schema).slice(0, 20)}`
  let script = document.getElementById(scriptId)
  if (!script) {
    script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(schema)
}
