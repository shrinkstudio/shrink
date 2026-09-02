import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { ReadinessQuiz } from './ReadinessQuiz';

export default declareComponent(ReadinessQuiz, {
  name: 'Readiness Quiz',
  description:
    "'Ready to brief a build?' — 7-question readiness quiz. Two-axis score (Readiness / Urgency), what the next site needs, where we'd start, a lead form, and a shareable link. Questions + scoring live in code; copy + endpoints below are editable.",
  group: 'Shrink',
  props: {
    theme: props.Variant({ name: 'Theme', options: ['light', 'dark'], defaultValue: 'light' }),

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
    bullet3: props.Text({ name: 'Bullet 3', defaultValue: 'Honest read, not a sales pitch' }),
    startLabel: props.Text({ name: 'Start button label', defaultValue: 'Start the quiz' }),

    // In-quiz
    backLabel: props.Text({ name: 'Back button label', defaultValue: 'Back' }),
    restartLabel: props.Text({ name: 'Retake label', defaultValue: 'Retake the quiz' }),

    // Integration
    submitEndpoint: props.Text({
      name: 'Lead submit endpoint',
      defaultValue: 'https://tools.shrink.studio/api/quiz-submit',
    }),
    shareBaseUrl: props.Text({
      name: 'Share link base URL',
      defaultValue: 'https://tools.shrink.studio',
    }),
  },
});
