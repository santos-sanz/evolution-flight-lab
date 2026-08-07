import type { Genome, SensorSnapshot } from "../types";
import { SeededRandom } from "./random";

export const INPUT_COUNT = 4;
export const HIDDEN_COUNT = 6;
export const OUTPUT_COUNT = 1;
export const GENE_COUNT = INPUT_COUNT * HIDDEN_COUNT + HIDDEN_COUNT + HIDDEN_COUNT * OUTPUT_COUNT + OUTPUT_COUNT;

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

export function createGenome(random: SeededRandom, id: string, generation = 1): Genome {
  return {
    id,
    generation,
    genes: Array.from({ length: GENE_COUNT }, () => random.normal(0, 0.7)),
  };
}

export function evaluateGenome(
  genome: Genome,
  inputs: [number, number, number, number],
  threshold = 0.5,
): SensorSnapshot {
  const { genes } = genome;
  const hidden = Array.from({ length: HIDDEN_COUNT }, (_, hiddenIndex) => {
    let sum = genes[INPUT_COUNT * HIDDEN_COUNT + hiddenIndex];
    for (let inputIndex = 0; inputIndex < INPUT_COUNT; inputIndex += 1) {
      sum += inputs[inputIndex] * genes[inputIndex * HIDDEN_COUNT + hiddenIndex];
    }
    return Math.tanh(sum);
  });

  const outputWeightsStart = INPUT_COUNT * HIDDEN_COUNT + HIDDEN_COUNT;
  let outputSum = genes[GENE_COUNT - 1];
  for (let index = 0; index < HIDDEN_COUNT; index += 1) {
    outputSum += hidden[index] * genes[outputWeightsStart + index];
  }
  const output = sigmoid(outputSum);

  return {
    verticalOffset: inputs[0],
    verticalVelocity: inputs[1],
    horizontalDistance: inputs[2],
    openingSize: inputs[3],
    hidden,
    output,
    threshold,
    flapped: output > threshold,
  };
}

export function crossover(
  parentA: Genome,
  parentB: Genome,
  random: SeededRandom,
  id: string,
  generation: number,
): Genome {
  return {
    id,
    generation,
    parents: [parentA.id, parentB.id],
    genes: parentA.genes.map((gene, index) => (random.next() < 0.5 ? gene : parentB.genes[index])),
  };
}

export function mutate(
  genome: Genome,
  random: SeededRandom,
  rate: number,
  sigma: number,
): Genome {
  let mutationCount = 0;
  const genes = genome.genes.map((gene) => {
    if (random.next() >= rate) return gene;
    mutationCount += 1;
    return gene + random.normal(0, sigma);
  });
  return { ...genome, genes, mutationCount };
}
