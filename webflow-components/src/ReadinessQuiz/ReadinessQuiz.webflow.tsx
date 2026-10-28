import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { ReadinessQuiz } from './ReadinessQuiz';

export default declareComponent(ReadinessQuiz, {
  name: 'Readiness Quiz',
  description:
    "'Ready to brief a build?' Seven-question readiness quiz: two-axis score (Readiness / Urgency), what the next site needs, where we'd start, a lead form and a shareable link. Questions and scoring live in code; copy and endpoints below are editable. Styles read the site variables.",
  group: 'Shrink',
  props: {
    theme: props.Variant({ name: 'Theme', options: ['light', 'dark'], defaultValue: 'light' }),
    frame: props.Variant({
      name: 'Frame (none = inside a page Card)',
      options: ['none', 'card'],
      defaultValue: 'none',
    }),

    // Intro
    eyebrow: props.Text({ name: 'Eyebrow', defaultValue: 'Readiness quiz' }),
    introHeading: props.Text({ name: 'Intro heading', defaultValue: 'Ready to brief a build?' }),
    introBody: props.Text({
      name: 'Intro body',
      defaultValue:
        "Seven quick questions. You'll get a readiness score, the gaps worth closing, and where we'd start.",
    }),
    bullet1: props.Text({ name: 'Bullet 1', defaultValue: 'About two minutes' }),
    bullet2: props.Text({ name: 'Bullet 2', defaultValue: 'No email to start' }),
    bullet3: props.Text({ name: 'Bullet 3', defaultValue: 'An honest read, with no sales pitch attached' }),
    startLabel: props.Text({ name: 'Start button label', defaultValue: 'Start the quiz' }),

    // In-quiz
    backLabel: props.Text({ name: 'Back button label', defaultValue: 'Back' }),
    restartLabel: props.Text({ name: 'Retake label', defaultValue: 'Retake the quiz' }),

    // Integration
    optInLabel: props.Text({
      name: 'Opt-in label',
      defaultValue: 'Send me guides and resources from Shrink',
    }),
    submitEndpoint: props.Text({
      name: 'Lead submit endpoint',
      defaultValue: 'https://shrink-site-api.vercel.app/api/forms',
    }),
    shareBaseUrl: props.Text({
      name: 'Share link page (empty = this page)',
      defaultValue: '',
    }),
  },
});
