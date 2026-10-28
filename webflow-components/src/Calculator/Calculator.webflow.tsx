import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { Calculator } from './Calculator';

export default declareComponent(Calculator, {
  name: 'Project Calculator',
  description:
    'An estimate for a build in about two minutes. A short branching question flow priced from the Shrink price book: the estimate, every line that makes it up, and the next step (a call or a brief) with a package pointer. Web apps and very large sites go to a call; retainers show their tier. Lead form posts to the site forms handler; a share link reopens the answers. Questions and pricing live in code; copy and links below are editable. Styles read the site variables.',
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
        "Answer a few questions about the site you need, and you'll see an estimate, how it adds up and what to do next. The prices are the ones we quote real projects from.",
    }),
    bullet1: props.Text({ name: 'Bullet 1', defaultValue: 'About two minutes' }),
    bullet2: props.Text({ name: 'Bullet 2', defaultValue: 'See your estimate straight away' }),
    bullet3: props.Text({ name: 'Bullet 3', defaultValue: 'See how it adds up' }),
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
        'An estimate from our standard price list, before VAT, to help you plan. Your final price comes in a fixed proposal once we have agreed the scope together.',
    }),
  },
});
