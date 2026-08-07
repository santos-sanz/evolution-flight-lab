import { describe, expect, it } from "vitest";
import { EvolutionEngine } from "./evolution";
import { FIXED_TIMESTEP } from "./game";

function runGeneration(engine: EvolutionEngine, maxSteps = 12_000) {
  let snapshot = engine.game.getSnapshot();
  for (let index = 0; index < maxSteps && !snapshot.ended; index += 1) {
    snapshot = engine.step(FIXED_TIMESTEP);
  }
  return engine.nextGeneration();
}

describe("EvolutionEngine", () => {
  it("keeps elites and fills the configured population", () => {
    const engine = new EvolutionEngine({ populationSize: 20, eliteCount: 4, seed: 11 });
    const stats = runGeneration(engine);
    expect(stats.generation).toBe(1);
    expect(engine.generation).toBe(2);
    expect(engine.population).toHaveLength(20);
    expect(engine.population.filter((genome) => genome.id.includes("elite"))).toHaveLength(4);
    expect(engine.lineage?.child.parents).toHaveLength(2);
  });

  it("restores a deterministic checkpoint", () => {
    const engine = new EvolutionEngine({ populationSize: 12, seed: 77 });
    runGeneration(engine);
    const checkpoint = engine.checkpoint();
    const restored = new EvolutionEngine({}, checkpoint);
    expect(restored.checkpoint()).toEqual(checkpoint);
    expect(restored.game.getSnapshot().gates).toEqual(engine.game.getSnapshot().gates);
  });

  it("learns to clear at least three gates within 40 generations", () => {
    const engine = new EvolutionEngine({ seed: 81247 });
    let bestGates = 0;
    for (let generation = 0; generation < 40 && bestGates < 3; generation += 1) {
      const stats = runGeneration(engine);
      bestGates = Math.max(bestGates, stats.bestGates);
    }
    expect(bestGates).toBeGreaterThanOrEqual(3);
  }, 20_000);
});
