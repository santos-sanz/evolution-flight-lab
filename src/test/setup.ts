import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: vi.fn(() => null),
});

Object.defineProperty(window, "confirm", {
  configurable: true,
  value: vi.fn(() => true),
});

let frameId = 0;
Object.defineProperty(window, "requestAnimationFrame", {
  configurable: true,
  value: vi.fn(() => ++frameId),
});
Object.defineProperty(window, "cancelAnimationFrame", {
  configurable: true,
  value: vi.fn(),
});
