export type GameMode = "manual" | "evolve" | "challenge";

export interface Genome {
  id: string;
  genes: number[];
  generation: number;
  parents?: [string, string];
  mutationCount?: number;
}

export interface EvolutionConfig {
  populationSize: number;
  eliteCount: number;
  tournamentSize: number;
  mutationRate: number;
  mutationSigma: number;
  seed: number;
}

export interface SensorSnapshot {
  verticalOffset: number;
  verticalVelocity: number;
  horizontalDistance: number;
  openingSize: number;
  hidden: number[];
  output: number;
  threshold: number;
  flapped: boolean;
}

export interface BirdSnapshot {
  id: string;
  y: number;
  velocity: number;
  alive: boolean;
  fitness: number;
  gatesCleared: number;
  hue: number;
  sensors?: SensorSnapshot;
}

export interface GateSnapshot {
  x: number;
  openingY: number;
  openingRadius: number;
}

export interface GameSnapshot {
  birds: BirdSnapshot[];
  gates: GateSnapshot[];
  distance: number;
  elapsed: number;
  aliveCount: number;
  ended: boolean;
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  bestGates: number;
  championId: string;
}

export interface LineageSnapshot {
  parentA: Genome;
  parentB: Genome;
  child: Genome;
}

export interface EvolutionCheckpoint {
  version: 1;
  config: EvolutionConfig;
  generation: number;
  population: Genome[];
  history: GenerationStats[];
  champion?: Genome;
  lineage?: LineageSnapshot;
}
