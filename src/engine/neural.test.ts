import { describe, expect, it } from "vitest";
import { GENE_COUNT, createGenome, crossover, evaluateGenome, mutate } from "./neural";
import { SeededRandom } from "./random";

describe("tiny neural network", () => {
  it("uses exactly 37 genes for a 4-6-1 network", () => {
    expect(GENE_COUNT).toBe(37);
    expect(createGenome(new SeededRandom(1), "bird").genes).toHaveLength(37);
  });

  it("returns a neutral 0.5 decision for zero weights", () => {
    const snapshot = evaluateGenome({ id: "zero", generation: 1, genes: Array(37).fill(0) }, [1, -1, 0.5, 0.7]);
    expect(snapshot.hidden).toEqual(Array(6).fill(0));
    expect(snapshot.output).toBe(0.5);
    expect(snapshot.flapped).toBe(false);
  });

  it("crosses parent genes and mutates reproducibly", () => {
    const parentA = { id: "a", generation: 1, genes: Array(37).fill(-1) };
    const parentB = { id: "b", generation: 1, genes: Array(37).fill(1) };
    const child = crossover(parentA, parentB, new SeededRandom(3), "c", 2);
    expect(child.genes.every((gene) => gene === -1 || gene === 1)).toBe(true);
    const changed = mutate(child, new SeededRandom(4), 1, 0.25);
    expect(changed.mutationCount).toBe(37);
    expect(changed.genes).not.toEqual(child.genes);
  });
});
