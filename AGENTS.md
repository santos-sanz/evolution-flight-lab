# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product-specific decisions

- The selected visual target is `docs/design-reference.png`, direction 1: a bright Wind Tunnel Laboratory.
- The product and repository name is `Evolution Flight Lab`; all UI and documentation are English.
- Preserve the mock's hierarchy: flight simulation first, live neural explanation second, controls and generation history below.
- Use only original glider, gate, and environment artwork from `public/assets/`; do not reproduce Flappy Bird assets, green pipes, branding, or trade dress.
- The repository is public source code only. Do not add a hosting or deployment workflow.
