import type {
  EvolutionCheckpoint,
  EvolutionConfig,
  GameSnapshot,
  GenerationStats,
  Genome,
  LineageSnapshot,
} from "../types";
import { GameEngine } from "./game";
import { createGenome, crossover, mutate } from "./neural";
import { SeededRandom } from "./random";

export const DEFAULT_CONFIG: EvolutionConfig = {
  populationSize: 60,
  eliteCount: 4,
  tournamentSize: 3,
  mutationRate: 0.08,
  mutationSigma: 0.25,
  seed: 81247,
};

export class EvolutionEngine {
  config: EvolutionConfig;
  generation: number;
  population: Genome[];
  history: GenerationStats[];
  champion?: Genome;
  lineage?: LineageSnapshot;
  game: GameEngine;
  private random: SeededRandom;

  constructor(config: Partial<EvolutionConfig> = {}, checkpoint?: EvolutionCheckpoint) {
    if (checkpoint) {
      this.config = { ...checkpoint.config };
      this.generation = checkpoint.generation;
      this.population = checkpoint.population.map((genome) => ({ ...genome, genes: [...genome.genes] }));
      this.history = checkpoint.history.map((item) => ({ ...item }));
      this.champion = checkpoint.champion ? { ...checkpoint.champion, genes: [...checkpoint.champion.genes] } : undefined;
      this.lineage = checkpoint.lineage;
    } else {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.generation = 1;
      this.history = [];
      this.random = new SeededRandom(this.config.seed + 17);
      this.population = Array.from({ length: this.config.populationSize }, (_, index) =>
        createGenome(this.random, `g1-${index + 1}`, 1),
      );
    }
    this.random = new SeededRandom(this.config.seed + this.generation * 1009);
    this.game = new GameEngine(this.config.seed, this.population);
  }

  step(dt?: number): GameSnapshot {
    return this.game.step(dt);
  }

  private rankedPopulation(): Array<{ genome: Genome; fitness: number; gates: number }> {
    const results = new Map(this.game.getRankedBirds().map((bird) => [bird.id, bird]));
    return this.population
      .map((genome) => ({
        genome,
        fitness: results.get(genome.id)?.fitness ?? 0,
        gates: results.get(genome.id)?.gatesCleared ?? 0,
      }))
      .sort((a, b) => b.fitness - a.fitness);
  }

  private tournament(ranked: ReturnType<EvolutionEngine["rankedPopulation"]>): Genome {
    let winner = ranked[this.random.integer(ranked.length)];
    for (let index = 1; index < this.config.tournamentSize; index += 1) {
      const contender = ranked[this.random.integer(ranked.length)];
      if (contender.fitness > winner.fitness) winner = contender;
    }
    return winner.genome;
  }

  nextGeneration(): GenerationStats {
    const ranked = this.rankedPopulation();
    const averageFitness = ranked.reduce((sum, item) => sum + item.fitness, 0) / ranked.length;
    const stats: GenerationStats = {
      generation: this.generation,
      bestFitness: ranked[0].fitness,
      averageFitness,
      bestGates: ranked[0].gates,
      championId: ranked[0].genome.id,
    };
    this.history.push(stats);
    if (!this.champion || stats.bestFitness >= (this.history.at(-2)?.bestFitness ?? -Infinity)) {
      this.champion = { ...ranked[0].genome, genes: [...ranked[0].genome.genes] };
    }

    const nextGenerationNumber = this.generation + 1;
    const nextPopulation: Genome[] = ranked.slice(0, this.config.eliteCount).map((item, index) => ({
      ...item.genome,
      id: `g${nextGenerationNumber}-elite-${index + 1}`,
      generation: nextGenerationNumber,
      genes: [...item.genome.genes],
      parents: [item.genome.id, item.genome.id],
      mutationCount: 0,
    }));

    let firstLineage: LineageSnapshot | undefined;
    while (nextPopulation.length < this.config.populationSize) {
      const parentA = this.tournament(ranked);
      const parentB = this.tournament(ranked);
      const childId = `g${nextGenerationNumber}-${nextPopulation.length + 1}`;
      const child = mutate(
        crossover(parentA, parentB, this.random, childId, nextGenerationNumber),
        this.random,
        this.config.mutationRate,
        this.config.mutationSigma,
      );
      nextPopulation.push(child);
      firstLineage ??= { parentA, parentB, child };
    }

    this.lineage = firstLineage;
    this.population = nextPopulation;
    this.generation = nextGenerationNumber;
    this.random = new SeededRandom(this.config.seed + this.generation * 1009);
    this.game = new GameEngine(this.config.seed, this.population);
    return stats;
  }

  updateConfig(next: Partial<EvolutionConfig>): void {
    this.config = { ...this.config, ...next };
  }

  createChallenge(): GameEngine | undefined {
    return this.champion ? new GameEngine(this.config.seed + 100_003, [this.champion]) : undefined;
  }

  checkpoint(): EvolutionCheckpoint {
    return {
      version: 1,
      config: { ...this.config },
      generation: this.generation,
      population: this.population.map((genome) => ({ ...genome, genes: [...genome.genes] })),
      history: this.history.map((item) => ({ ...item })),
      champion: this.champion ? { ...this.champion, genes: [...this.champion.genes] } : undefined,
      lineage: this.lineage,
    };
  }
}
