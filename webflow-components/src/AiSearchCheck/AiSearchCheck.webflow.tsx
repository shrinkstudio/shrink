import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { AiSearchCheck } from './AiSearchCheck';

export default declareComponent(AiSearchCheck, {
  name: 'AI Search Check',
  description:
    'Reads a website the way AI tools do and shows two scores (site readiness, agent readiness), the three changes that would help most and all 17 checks. Leaving an email gets the report with what ChatGPT, Claude and Perplexity say about the company. Mode "tool" runs the check (?site= runs it straight away); mode "launcher" is just the field, and opens the tool page with the site filled in. Checks run in api/scan.ts; copy and links below are editable. Styles read the site variables.',
  group: 'Shrink',
  props: {
    mode: props.Variant({ name: 'Mode', options: ['tool', 'launcher'], defaultValue: 'tool' }),
    theme: props.Variant({ name: 'Theme', options: ['light', 'dark'], defaultValue: 'light' }),
    frame: props.Variant({
      name: 'Frame (none = inside a page Card)',
      options: ['none', 'card'],
      defaultValue: 'none',
    }),

    // Intro (optional: the tool page carries its own heading)
    eyebrow: props.Text({ name: 'Eyebrow', defaultValue: '' }),
    introHeading: props.Text({ name: 'Intro heading', defaultValue: '' }),
    introBody: props.Text({ name: 'Intro body', defaultValue: '' }),

    // Field
    fieldLabel: props.Text({ name: 'Field label', defaultValue: 'Your website' }),
    placeholder: props.Text({ name: 'Placeholder', defaultValue: 'yourcompany.com' }),
    buttonLabel: props.Text({ name: 'Button label', defaultValue: 'Check my site' }),
    note: props.Text({ name: 'Note under the field', defaultValue: 'Free, and your scores appear straight away.' }),
    showWhatWeCheck: props.Boolean({ name: 'Show "What we check"', defaultValue: true }),

    // Links
    toolLink: props.Text({ name: 'Tool page link (launcher)', defaultValue: '/tools/ai-search-check' }),
    callLink: props.Text({ name: 'Call link', defaultValue: '/calls/intro' }),

    // Integration
    optInLabel: props.Text({ name: 'Opt-in label', defaultValue: 'Send me guides and resources from Shrink' }),
    scanEndpoint: props.Text({ name: 'Scan endpoint', defaultValue: 'https://shrink-site-api.vercel.app/api/scan' }),
    submitEndpoint: props.Text({ name: 'Report request endpoint', defaultValue: 'https://shrink-site-api.vercel.app/api/forms' }),
    disclaimer: props.Text({
      name: 'Small print',
      defaultValue:
        'Your scores come from a quick look at your homepage and up to four key pages, so treat them as a helpful starting point. AI tools change often, and so do their answers.',
    }),
  },
});
