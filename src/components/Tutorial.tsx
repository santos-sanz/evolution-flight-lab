import { ArrowRight, X } from "@phosphor-icons/react";

const STEPS = [
  ["Fly it yourself", "Use Space, click, or tap. Your score becomes the benchmark evolution tries to beat."],
  ["Watch the sensors", "The champion sees its height error, vertical speed, distance, and the gate opening."],
  ["Read the tiny brain", "Six hidden neurons combine those inputs. Output above 0.50 means flap."],
  ["Breed a generation", "Fitter networks are selected, crossed, and mutated to create new candidate brains."],
  ["Test what it learned", "Run the champion on an unseen course to check whether it learned a strategy, not a route."],
] as const;

interface TutorialProps {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
}

export function Tutorial({ step, onStep, onClose }: TutorialProps) {
  const safeStep = Math.min(step, STEPS.length - 1);
  const [title, body] = STEPS[safeStep];
  return (
    <aside className="tutorial" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <button className="icon-button tutorial-close" onClick={onClose} aria-label="Close walkthrough"><X size={18} /></button>
      <p className="eyebrow">GUIDED WALKTHROUGH · {safeStep + 1} / {STEPS.length}</p>
      <h2 id="tutorial-title">{title}</h2>
      <p>{body}</p>
      <div className="tutorial-progress" aria-hidden="true">
        {STEPS.map((_, index) => <span className={index <= safeStep ? "done" : ""} key={index} />)}
      </div>
      <button className="text-button" onClick={() => safeStep === STEPS.length - 1 ? onClose() : onStep(safeStep + 1)}>
        {safeStep === STEPS.length - 1 ? "Finish tour" : "Next lesson"}<ArrowRight size={18} />
      </button>
    </aside>
  );
}
