import type { BirdSnapshot, GameSnapshot, GateSnapshot, Genome, SensorSnapshot } from "../types";
import { evaluateGenome } from "./neural";
import { SeededRandom } from "./random";

export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 600;
export const BIRD_X = 220;
export const BIRD_RADIUS = 18;
export const FIXED_TIMESTEP = 1 / 60;

const GRAVITY = 780;
const FLAP_VELOCITY = -315;
const SCROLL_SPEED = 165;
const GATE_SPACING = 365;
const GATE_WIDTH = 70;
const OPENING_RADIUS = 98;
const FLAP_COOLDOWN = 0.115;

interface BirdState extends BirdSnapshot {
  genome?: Genome;
  flapCooldown: number;
}

interface GateState extends GateSnapshot {
  id: number;
  passedBy: Set<string>;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class GameEngine {
  private readonly random: SeededRandom;
  private readonly birds: BirdState[];
  private readonly gates: GateState[] = [];
  private nextGateId = 1;
  private distance = 0;
  private elapsed = 0;

  constructor(seed: number, genomes: Genome[] = []) {
    this.random = new SeededRandom(seed);
    this.birds = (genomes.length ? genomes : [{ id: "human", genes: [], generation: 0 }]).map(
      (genome, index) => ({
        id: genome.id,
        genome: genomes.length ? genome : undefined,
        y: WORLD_HEIGHT * 0.48 + (index % 7) * 2,
        velocity: 0,
        alive: true,
        fitness: 0,
        gatesCleared: 0,
        hue: (index * 47) % 300,
        flapCooldown: 0,
      }),
    );
    for (let index = 0; index < 4; index += 1) {
      this.gates.push(this.createGate(WORLD_WIDTH * 0.74 + index * GATE_SPACING));
    }
  }

  private createGate(x: number): GateState {
    return {
      id: this.nextGateId++,
      x,
      openingY: this.random.range(OPENING_RADIUS + 48, WORLD_HEIGHT - OPENING_RADIUS - 58),
      openingRadius: OPENING_RADIUS,
      passedBy: new Set<string>(),
    };
  }

  private nextGateFor(bird: BirdState): GateState {
    return this.gates.find((gate) => gate.x + GATE_WIDTH / 2 >= BIRD_X && !gate.passedBy.has(bird.id)) ?? this.gates[0];
  }

  private sensorsFor(bird: BirdState): SensorSnapshot | undefined {
    if (!bird.genome) return undefined;
    const gate = this.nextGateFor(bird);
    const inputs: [number, number, number, number] = [
      clamp((gate.openingY - bird.y) / (WORLD_HEIGHT / 2), -1, 1),
      clamp(bird.velocity / 420, -1, 1),
      clamp((gate.x - BIRD_X) / GATE_SPACING, 0, 1),
      gate.openingRadius / 140,
    ];
    return evaluateGenome(bird.genome, inputs);
  }

  flapHuman(): void {
    const human = this.birds[0];
    if (human?.alive) {
      human.velocity = FLAP_VELOCITY;
      human.flapCooldown = FLAP_COOLDOWN;
    }
  }

  step(dt = FIXED_TIMESTEP): GameSnapshot {
    if (this.birds.every((bird) => !bird.alive)) return this.getSnapshot();
    const safeDt = Math.min(dt, FIXED_TIMESTEP * 2);
    this.elapsed += safeDt;
    this.distance += SCROLL_SPEED * safeDt;

    for (const gate of this.gates) gate.x -= SCROLL_SPEED * safeDt;
    const first = this.gates[0];
    if (first && first.x < -GATE_WIDTH * 2) {
      this.gates.shift();
      const lastX = this.gates.at(-1)?.x ?? WORLD_WIDTH;
      this.gates.push(this.createGate(lastX + GATE_SPACING));
    }

    for (const bird of this.birds) {
      if (!bird.alive) continue;
      bird.flapCooldown = Math.max(0, bird.flapCooldown - safeDt);
      const sensors = this.sensorsFor(bird);
      bird.sensors = sensors;
      if (sensors?.flapped && bird.flapCooldown === 0) {
        bird.velocity = FLAP_VELOCITY;
        bird.flapCooldown = FLAP_COOLDOWN;
      }
      bird.velocity += GRAVITY * safeDt;
      bird.y += bird.velocity * safeDt;

      for (const passedGate of this.gates) {
        if (passedGate.x + GATE_WIDTH / 2 < BIRD_X && !passedGate.passedBy.has(bird.id)) {
          passedGate.passedBy.add(bird.id);
          bird.gatesCleared += 1;
        }
      }
      const gate = this.nextGateFor(bird);
      const inGateColumn = Math.abs(gate.x - BIRD_X) < GATE_WIDTH / 2 + BIRD_RADIUS;
      const outsideOpening = Math.abs(bird.y - gate.openingY) > gate.openingRadius - BIRD_RADIUS;
      const hitBoundary = bird.y < BIRD_RADIUS || bird.y > WORLD_HEIGHT - BIRD_RADIUS;

      if (hitBoundary || (inGateColumn && outsideOpening)) {
        bird.alive = false;
        continue;
      }

      const alignment = 1 - Math.min(1, Math.abs(gate.openingY - bird.y) / (WORLD_HEIGHT / 2));
      bird.fitness += SCROLL_SPEED * safeDt + alignment * safeDt * 5 + bird.gatesCleared * safeDt * 0.5;
    }
    return this.getSnapshot();
  }

  getSnapshot(): GameSnapshot {
    return {
      birds: this.birds.map((bird) => ({
        id: bird.id,
        y: bird.y,
        velocity: bird.velocity,
        alive: bird.alive,
        fitness: bird.fitness,
        gatesCleared: bird.gatesCleared,
        hue: bird.hue,
        sensors: bird.sensors,
      })),
      gates: this.gates.map((gate) => ({
        x: gate.x,
        openingY: gate.openingY,
        openingRadius: gate.openingRadius,
      })),
      distance: this.distance,
      elapsed: this.elapsed,
      aliveCount: this.birds.filter((bird) => bird.alive).length,
      ended: this.birds.every((bird) => !bird.alive),
    };
  }

  getRankedBirds(): BirdSnapshot[] {
    return [...this.getSnapshot().birds].sort((a, b) => b.fitness - a.fitness);
  }
}
