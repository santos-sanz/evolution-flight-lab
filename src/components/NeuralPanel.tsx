import {
  ArrowsOutLineVertical,
  Compass,
  Gauge,
  Path,
} from "@phosphor-icons/react";
import type { SensorSnapshot } from "../types";

const EMPTY: SensorSnapshot = {
  verticalOffset: 0,
  verticalVelocity: 0,
  horizontalDistance: 1,
  openingSize: 0.7,
  hidden: [0, 0, 0, 0, 0, 0],
  output: 0,
  threshold: 0.5,
  flapped: false,
};

const format = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

export function NeuralPanel({ sensors = EMPTY }: { sensors?: SensorSnapshot }) {
  const inputs = [
    { icon: Compass, label: "Gap centered?", hint: "target − glider", value: sensors.verticalOffset, tone: "blue" },
    { icon: ArrowsOutLineVertical, label: "Vertical speed", hint: "up is negative", value: sensors.verticalVelocity, tone: "violet" },
    { icon: Path, label: "Distance to gate", hint: "1 is far away", value: sensors.horizontalDistance, tone: "green" },
    { icon: Gauge, label: "Opening size", hint: "bigger is safer", value: sensors.openingSize, tone: "orange" },
  ];

  return (
    <section className="neural-panel" aria-labelledby="why-heading">
      <header className="section-heading">
        <div>
          <p className="eyebrow">LIVE DECISION</p>
          <h2 id="why-heading">Why did it flap?</h2>
        </div>
        <span className={`decision-pill ${sensors.flapped ? "is-flap" : ""}`}>
          {sensors.flapped ? "FLAP" : "GLIDE"}
        </span>
      </header>
      <p className="section-copy">
        The network looks at four numbers. An output above <strong>0.50</strong> triggers a flap.
      </p>
      <div className="network-layout">
        <div className="sensor-list">
          {inputs.map(({ icon: Icon, label, hint, value, tone }) => (
            <div className={`sensor-row tone-${tone}`} key={label}>
              <Icon size={22} weight="duotone" aria-hidden="true" />
              <span><strong>{label}</strong><small>{hint}</small></span>
              <output>{format(value)}</output>
            </div>
          ))}
        </div>
        <div className="brain-column" aria-label="Six hidden neurons">
          <span className="micro-label">HIDDEN LAYER (6)</span>
          <div className="neuron-stack">
            {sensors.hidden.map((activation, index) => (
              <span
                className="neuron"
                key={index}
                style={{ opacity: 0.32 + Math.abs(activation) * 0.68 }}
                title={`Neuron ${index + 1}: ${activation.toFixed(2)}`}
              />
            ))}
          </div>
        </div>
        <div className="output-column">
          <span className="micro-label">OUTPUT</span>
          <strong>{sensors.output.toFixed(2)}</strong>
          <div className="output-meter" aria-hidden="true">
            <span style={{ width: `${Math.min(100, sensors.output * 100)}%` }} />
            <i style={{ left: `${sensors.threshold * 100}%` }} />
          </div>
          <small>threshold 0.50</small>
        </div>
      </div>
      <p className="plain-decision" aria-live="polite">
        {sensors.flapped
          ? `Output ${sensors.output.toFixed(2)} crossed the threshold, so the glider flapped.`
          : `Output ${sensors.output.toFixed(2)} stayed below the threshold, so the glider kept gliding.`}
      </p>
    </section>
  );
}
