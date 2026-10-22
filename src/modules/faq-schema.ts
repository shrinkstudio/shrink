// -----------------------------------------
// FAQ SCHEMA — FAQPage JSON-LD from rendered accordions
// -----------------------------------------
// Put data-faq-schema on a Collection List wrapper (or any element) that holds
// Accordion instances. On load this reads each accordion's title and content and
// writes one FAQPage script into <head>, so the questions are marked up without
// a per-page schema field. Google reads JSON-LD added by script (rendered DOM).
//
// Markup read (the site Accordion component):
//   [data-faq-schema]
//     details.accordion-component
//       summary .accordion-title      ← question
//       [data-accordion="content"]    ← answer (text, tags stripped)
//
// Several marked elements on one page merge into one FAQPage. Nothing is
// written when no question/answer pairs are found.
// -----------------------------------------

interface FaqPair {
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
}

const clean = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

export function initFaqSchema(scope: ParentNode = document): void {
  const roots = [...scope.querySelectorAll<HTMLElement>('[data-faq-schema]')];
  if (!roots.length) return;

  const pairs: FaqPair[] = [];
  for (const root of roots) {
    for (const item of root.querySelectorAll<HTMLElement>('details.accordion-component')) {
      const name = clean(item.querySelector('.accordion-title'));
      const text = clean(item.querySelector('[data-accordion="content"]'));
      if (name && text) pairs.push({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } });
    }
  }
  if (!pairs.length) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-faq-schema-out', '');
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs,
  });
  document.head.appendChild(script);
}
