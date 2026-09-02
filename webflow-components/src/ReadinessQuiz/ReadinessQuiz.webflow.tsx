import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { ReadinessQuiz } from './ReadinessQuiz';

export default declareComponent(ReadinessQuiz, {
  name: 'Readiness Quiz',
  description:
    "'Ready to brief a build?' — 7-question readiness quiz. Returns a score, the gaps worth closing, and where we'd start. Questions + scoring live in code; copy below is editable.",
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

    // Results
    gapsLabel: props.Text({ name: 'Results — gaps heading', defaultValue: 'Gaps worth closing' }),
    recoLabel: props.Text({ name: 'Results — recommendation heading', defaultValue: "Where we'd start" }),
    ctaLabel: props.Text({ name: 'Results CTA label', defaultValue: 'Book a call' }),
    ctaLink: props.Link({ name: 'Results CTA link' }),
    restartLabel: props.Text({ name: 'Retake label', defaultValue: 'Retake the quiz' }),
  },
});
