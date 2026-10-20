import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { Calculator } from './Calculator';

export default declareComponent(Calculator, {
  name: 'Project Calculator',
  description:
    'Price range for a build in about two minutes. A short branching question flow, priced off the Shrink rate card: the range, what moved the figure (pages, integrations, timing), where the money goes, and the next step (a call or a brief) with a package pointer. Lead form posts to the site forms handler. Questions and pricing live in code; copy and links below are editable. Styles read the site variables.',
  group: 'Shrink',
  props: {
    theme: props.Variant({ name: 'Theme', options: ['light', 'dark'], defaultValue: 'light' }),
    frame: props.Variant({
      name: 'Frame (none = inside a page Card)',
      options: ['none', 'card'],
      defaultValue: 'none',
    }),

    // Intro
    eyebrow: props.Text({ name: 'Eyebrow', defaultValue: 'Project calculator' }),
    introHeading: props.Text({ name: 'Intro heading', defaultValue: 'What would your site cost?' }),
    introBody: props.Text({
      name: 'Intro body',
      defaultValue:
        'A few plain questions, priced against the same rate card we scope real builds with. You get a range, what moved it, and the next step.',
    }),
    bullet1: props.Text({ name: 'Bullet 1', defaultValue: 'About two minutes' }),
    bullet2: props.Text({ name: 'Bullet 2', defaultValue: 'No email to see the figure' }),
    bullet3: props.Text({ name: 'Bullet 3', defaultValue: 'A range, with the levers that move it' }),
    startLabel: props.Text({ name: 'Start button label', defaultValue: 'Start the calculator' }),

    // Flow
    backLabel: props.Text({ name: 'Back button label', defaultValue: 'Back' }),
    restartLabel: props.Text({ name: 'Start over label', defaultValue: 'Start over' }),
    showWebApp: props.Boolean({ name: 'Offer "A web app or product"', defaultValue: true }),

    // Next step links
    callLink: props.Text({ name: 'Call link', defaultValue: '/calls/intro' }),
    compoundCallLink: props.Text({ name: 'Compound call link', defaultValue: '/calls/compound' }),
    briefLink: props.Text({ name: 'Brief link', defaultValue: '/contact?service=development' }),

    // Integration
    optInLabel: props.Text({
      name: 'Opt-in label',
      defaultValue: 'Send me guides and resources from Shrink',
    }),
    submitEndpoint: props.Text({
      name: 'Lead submit endpoint',
      defaultValue: 'https://shrink-site-api.vercel.app/api/forms',
    }),
    disclaimer: props.Text({
      name: 'Small print',
      defaultValue:
        'An indicative range from our standard rate card, excluding VAT. The price is fixed once the scope is agreed.',
    }),
  },
});
