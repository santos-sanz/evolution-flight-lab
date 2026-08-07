# How Evolution Flight Lab Learns

This guide explains every moving part of the experiment without assuming prior knowledge of neural networks, genetics, or advanced mathematics.

## 1. The central idea

An evolutionary algorithm searches for useful solutions by maintaining a **population** of candidates instead of improving one candidate directly.

In this game, a candidate is a tiny neural network that controls one glider. Every candidate attempts the same flight course. Gliders that remain alive and pass gates receive higher fitness. Their genomes are more likely to contribute to the next generation.

The loop is:

```text
create population
      ↓
evaluate every glider on the same course
      ↓
assign fitness
      ↓
select parents
      ↓
crossover + mutation
      ↓
new population → repeat
```

There is no backpropagation and no gradient. A glider is not told which individual weight was wrong. Evolution only sees how well the complete network performed.

## 2. The flight world

The simulation uses a fixed 60 Hz timestep. That means physics advances by exactly `1/60` of a second per step, even when the interface renders at a different rate or the user selects 8× speed.

A glider has:

- a fixed horizontal position;
- a vertical position;
- a vertical velocity;
- gravity pulling it downward;
- a flap impulse that changes its velocity upward;
- a short flap cooldown that prevents continuous thrust.

The gates move left at a constant speed, which is equivalent to the glider moving forward through the tunnel. A collision occurs when the glider reaches the floor, ceiling, or solid rim of a gate.

Fixed timesteps matter because evolutionary comparisons should not depend on a fast laptop, a slow phone, or a momentary dropped frame.

## 3. What the network sees

The network receives four normalized values:

| Input | Intuition | Typical range |
| --- | --- | --- |
| Vertical offset | Is the opening above or below me? | `-1` to `1` |
| Vertical velocity | Am I rising or falling, and how fast? | `-1` to `1` |
| Horizontal distance | How soon will I reach the next gate? | `0` to `1` |
| Opening size | How much vertical room is available? | Around `0.7` |

Normalization keeps very different physical units—pixels, pixels per second, and distances—on comparable scales.

The network does **not** receive a hand-written instruction such as “flap when below the opening.” It must encode that useful relationship in its weights.

## 4. The 4 → 6 → 1 brain

The architecture is intentionally small enough to inspect:

```text
4 sensor inputs → 6 hidden neurons → 1 output
```

Each hidden neuron calculates a weighted sum:

```text
hidden = tanh(input₁ × weight₁ + ... + input₄ × weight₄ + bias)
```

The output neuron combines all six hidden values and applies a sigmoid:

```text
output = sigmoid(hidden₁ × weight₁ + ... + hidden₆ × weight₆ + bias)
```

Sigmoid compresses any number into the interval from 0 to 1. When output is greater than `0.50`, the controller requests a flap. Otherwise, it glides.

### Why 37 genes?

- Input-to-hidden weights: `4 × 6 = 24`
- Hidden biases: `6`
- Hidden-to-output weights: `6 × 1 = 6`
- Output bias: `1`
- Total: `24 + 6 + 6 + 1 = 37`

Those 37 floating-point values are the genome. Evolution changes the brain by changing those values.

## 5. Fitness: the signal evolution can see

Fitness is a score, not a moral judgment and not the game’s visible human score. It is the signal used to rank candidate solutions.

Evolution Flight Lab rewards:

1. forward flight distance;
2. clearing gates;
3. a small continuous alignment bonus for staying near the next opening.

The alignment term creates a smoother learning signal before a random population can clear its first gate. The gate reward ensures that the actual objective eventually dominates merely surviving.

An important rule is that every glider in a training generation sees the same seeded gate sequence. Otherwise, a lucky easy course could make a weak network appear fitter than a stronger one.

## 6. Selection

The lab uses **tournament selection** with tournament size three:

```text
pick 3 candidates at random
choose the fittest of those 3 as a parent
repeat when another parent is needed
```

Tournament selection creates pressure toward better solutions while preserving some variety. The global champion does not become every parent automatically.

The four fittest networks are also copied directly into the next generation. This is called **elitism**. It guarantees that a strong solution is not lost because of unlucky crossover or mutation.

## 7. Crossover

Each non-elite child has two selected parents. Uniform crossover considers every gene independently:

```text
for each of the 37 positions:
  choose the value from parent A or parent B with equal probability
```

Crossover can combine a useful response to vertical velocity from one parent with useful gate-timing behavior from another. It can also break useful combinations. Evolution keeps the combinations that perform well.

## 8. Mutation

After crossover, every gene has an independent chance to mutate. The default mutation rate is 8%.

A mutation adds Gaussian noise with standard deviation `0.25`:

```text
new_gene = old_gene + random_normal(mean = 0, sigma = 0.25)
```

Mutation supplies new variation. Without it, a population can only reshuffle values that already exist. Too much mutation destroys useful structures faster than selection can preserve them.

This tension is called the **exploration–exploitation tradeoff**:

- low mutation exploits known good regions of the search space;
- high mutation explores new regions;
- a useful middle value does both.

## 9. Reproducibility

Computers do not need true randomness for this experiment. A seeded pseudo-random number generator creates a repeatable sequence.

The seed controls:

- the training gate sequence;
- initial genomes;
- tournament participants;
- crossover choices;
- mutation decisions and magnitudes.

Using the same configuration and seed produces the same experiment. This makes debugging, teaching, and automated tests far more reliable.

Changing the seed starts a genuinely different experiment.

## 10. Generalization and the unseen course

A network can perform well for two different reasons:

1. it learned a reusable control strategy;
2. it became specialized to the exact training sequence.

The **Test champion** action uses a separate, unseen seed. Training does not change during this run. A champion that still clears gates has evidence of generalization.

This is the same principle behind keeping training and test data separate in machine learning.

## 11. Guided experiments

### Experiment A: Remove mutation

1. Start a new experiment with the default settings.
2. Set mutation to 0%.
3. Observe 15–20 generations.

Expected observation: crossover can recombine existing genes, but the population may plateau because no new values enter the gene pool.

### Experiment B: Mutation overload

1. Use the same seed.
2. Set mutation to 25%.
3. Compare the best and average fitness curves.

Expected observation: occasional breakthroughs may happen, but strong behavior is frequently damaged. Average fitness often becomes noisy.

### Experiment C: Population size

1. Compare populations of 10, 60, and 200 with the same seed.
2. Keep all other settings fixed.

Expected observation: larger populations explore more candidates per generation, but require more computation. A small population may converge quickly to a mediocre strategy.

### Experiment D: Generalization

1. Train until the champion clears several gates.
2. Use Test champion.
3. Compare its training and unseen-course scores.

Expected observation: performance may drop. That gap is useful information, not a failure of the test.

## 12. Common misconceptions

### “The gliders learn during a single flight.”

They do not. A network’s genes remain fixed during evaluation. Learning happens between generations when the population is selected and reproduced.

### “The champion passes its experience to its children.”

Children inherit network weights, not memories of positions or collisions.

### “Evolution always improves every generation.”

Average fitness can fall and individual children can be worse. Elitism preserves strong genomes, while population-level progress remains stochastic.

### “A high mutation rate means faster learning.”

Higher mutation means larger search disruption, not guaranteed progress.

## 13. Glossary

- **Candidate:** one possible solution; here, one neural-network controller.
- **Population:** all candidates evaluated in a generation.
- **Genome:** the 37 evolvable network values.
- **Gene:** one value in a genome.
- **Phenotype:** the behavior produced by the genome—the flight decisions you observe.
- **Fitness:** the numeric score used to compare candidates.
- **Selection pressure:** how strongly fitter candidates are favored as parents.
- **Elitism:** copying top candidates unchanged.
- **Crossover:** combining genes from two parents.
- **Mutation:** randomly perturbing genes.
- **Generation:** one complete evaluate-and-reproduce cycle.
- **Convergence:** the population becoming similar and progress slowing.
- **Generalization:** performing well beyond the exact training cases.
- **Seed:** a number that makes pseudo-random choices reproducible.

## 14. Read the code in this order

1. [`src/engine/random.ts`](../src/engine/random.ts) — deterministic randomness.
2. [`src/engine/neural.ts`](../src/engine/neural.ts) — the 37-gene network, crossover, and mutation.
3. [`src/engine/game.ts`](../src/engine/game.ts) — physics, sensors, collisions, and fitness.
4. [`src/engine/evolution.ts`](../src/engine/evolution.ts) — selection, elitism, generations, and checkpoints.
5. [`src/App.tsx`](../src/App.tsx) — interactive orchestration and learning flow.

The tests beside each engine file are executable examples of the intended behavior.
