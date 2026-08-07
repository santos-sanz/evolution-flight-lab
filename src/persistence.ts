import type { EvolutionCheckpoint, EvolutionConfig } from "./types";

const STORAGE_KEY = "evolution-flight-lab:v1";

export interface PersistedState {
  humanBest: number;
  tutorialStep: number;
  settings: Pick<EvolutionConfig, "populationSize" | "mutationRate" | "seed">;
  checkpoint?: EvolutionCheckpoint;
}

export const DEFAULT_PERSISTED_STATE: PersistedState = {
  humanBest: 0,
  tutorialStep: 0,
  settings: { populationSize: 60, mutationRate: 0.08, seed: 81247 },
};

export function loadState(storage: Pick<Storage, "getItem"> = localStorage): PersistedState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...DEFAULT_PERSISTED_STATE,
      ...parsed,
      settings: { ...DEFAULT_PERSISTED_STATE.settings, ...parsed.settings },
    };
  } catch {
    return DEFAULT_PERSISTED_STATE;
  }
}

export function saveState(state: PersistedState, storage: Pick<Storage, "setItem"> = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(storage: Pick<Storage, "removeItem"> = localStorage): void {
  storage.removeItem(STORAGE_KEY);
}

export { STORAGE_KEY };
