// -----------------------------------------
// STAGE SCALE — fit a fixed-size illustration stage to its card
// -----------------------------------------
// Illustrations are drawn at Figma pixel size (eg. 318 x 420) and scaled to
// the card with a transform. CSS does this alone with
// scale(tan(atan2(100cqw, 318px))), but iOS Safari resolves that far too large,
// so this measures the card and hands CSS the number instead.
//
// Markup (CSS built in Webflow):
//   [data-stage="318"]   ← the stage; value = its design width in px
//
// CSS reads it with a fallback, so nothing breaks before this runs:
//   transform: scale(var(--stage-scale, tan(atan2(100cqw, 318px))));
// -----------------------------------------

let observer: ResizeObserver | null = null;
let stages: HTMLElement[] = [];

const fit = (stage: HTMLElement) => {
  const width = Number(stage.getAttribute('data-stage'));
  const box = stage.parentElement;
  if (!width || !box) return;
  stage.style.setProperty('--stage-scale', String(box.clientWidth / width));
};

/** Scales every stage in the scope and keeps it fitted as cards resize. */
export const initStageScale = (scope: ParentNode = document) => {
  const found = [...scope.querySelectorAll<HTMLElement>('[data-stage]')].filter(
    (stage) => !stages.includes(stage)
  );
  if (!found.length) return;

  observer ||= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const stage = (entry.target as HTMLElement).querySelector<HTMLElement>(
        ':scope > [data-stage]'
      );
      if (stage) fit(stage);
    }
  });

  for (const stage of found) {
    stages.push(stage);
    fit(stage);
    if (stage.parentElement) observer.observe(stage.parentElement);
  }
};

export const destroyStageScale = () => {
  observer?.disconnect();
  observer = null;
  for (const stage of stages) stage.style.removeProperty('--stage-scale');
  stages = [];
};
