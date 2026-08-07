import { ArrowRight, Dna, Sparkle } from "@phosphor-icons/react";
import type { LineageSnapshot } from "../types";

const shortId = (id?: string) => id?.replace("elite-", "e") ?? "waiting";

export function LineagePanel({ lineage }: { lineage?: LineageSnapshot }) {
  return (
    <section className="lineage-panel" aria-labelledby="lineage-heading">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">EVOLUTION LOOP</p>
          <h2 id="lineage-heading">How this generation was born</h2>
        </div>
      </div>
      <div className="lineage-flow">
        <div className="parent-pair">
          <div><img src="/assets/glider.png" alt="Parent A glider" /><small>{shortId(lineage?.parentA.id)}</small></div>
          <div><img className="purple-glider" src="/assets/glider.png" alt="Parent B glider" /><small>{shortId(lineage?.parentB.id)}</small></div>
        </div>
        <ArrowRight size={22} aria-hidden="true" />
        <div className="lineage-step"><Dna size={30} weight="duotone" /><span>CROSSOVER<small>Mix both parents</small></span></div>
        <ArrowRight size={22} aria-hidden="true" />
        <div className="lineage-step"><Sparkle size={30} weight="duotone" /><span>MUTATION<small>{lineage?.child.mutationCount ?? 0} small changes</small></span></div>
        <ArrowRight size={22} aria-hidden="true" />
        <div className="child-glider"><img src="/assets/glider.png" alt="Child glider" /><small>{shortId(lineage?.child.id)}</small></div>
      </div>
    </section>
  );
}
