import { describe, expect, it } from "vitest";
import { DEFAULT_PERSISTED_STATE, clearState, loadState, saveState, STORAGE_KEY } from "./persistence";

describe("local persistence", () => {
  it("falls back safely when storage is empty or corrupt", () => {
    expect(loadState({ getItem: () => null })).toEqual(DEFAULT_PERSISTED_STATE);
    expect(loadState({ getItem: () => "not json" })).toEqual(DEFAULT_PERSISTED_STATE);
  });

  it("saves and clears the versioned payload", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    saveState({ ...DEFAULT_PERSISTED_STATE, humanBest: 12 }, storage);
    expect(loadState(storage).humanBest).toBe(12);
    expect(values.has(STORAGE_KEY)).toBe(true);
    clearState(storage);
    expect(values.has(STORAGE_KEY)).toBe(false);
  });
});
