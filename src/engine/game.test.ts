import { describe, expect, it } from "vitest";
import { FIXED_TIMESTEP, GameEngine } from "./game";

describe("GameEngine", () => {
  it("generates the same course from the same seed", () => {
    const first = new GameEngine(81247).getSnapshot();
    const second = new GameEngine(81247).getSnapshot();
    expect(first.gates).toEqual(second.gates);
  });

  it("applies a human flap and then gravity", () => {
    const engine = new GameEngine(5);
    engine.flapHuman();
    const after = engine.step(FIXED_TIMESTEP);
    expect(after.birds[0].velocity).toBeLessThan(0);
    expect(after.birds[0].y).toBeLessThan(600 * 0.48);
  });

  it("ends a run when the glider reaches a boundary", () => {
    const engine = new GameEngine(5);
    let snapshot = engine.getSnapshot();
    for (let index = 0; index < 300 && !snapshot.ended; index += 1) snapshot = engine.step(FIXED_TIMESTEP);
    expect(snapshot.ended).toBe(true);
    expect(snapshot.birds[0].fitness).toBeGreaterThan(0);
  });
});
