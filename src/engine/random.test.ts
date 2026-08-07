import { describe, expect, it } from "vitest";
import { SeededRandom } from "./random";

describe("SeededRandom", () => {
  it("replays the same sequence for the same seed", () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    expect(Array.from({ length: 10 }, () => first.next())).toEqual(
      Array.from({ length: 10 }, () => second.next()),
    );
  });

  it("produces finite Gaussian mutations", () => {
    const random = new SeededRandom(9);
    const samples = Array.from({ length: 100 }, () => random.normal(0, 0.25));
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(samples.some((value) => value > 0)).toBe(true);
    expect(samples.some((value) => value < 0)).toBe(true);
  });
});
