import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  BezierCurve,
  BookOpen,
  CaretRight,
  Flask,
  Gauge,
  Pause,
  Play,
  SkipForward,
  Sparkle,
} from "@phosphor-icons/react";
import { EvolutionEngine, DEFAULT_CONFIG } from "./engine/evolution";
import { FIXED_TIMESTEP, GameEngine } from "./engine/game";
import { clearState, loadState, saveState } from "./persistence";
import type { GameMode, GameSnapshot, GenerationStats } from "./types";
import { FitnessChart } from "./components/FitnessChart";
import { GameCanvas } from "./components/GameCanvas";
import { LineagePanel } from "./components/LineagePanel";
import { NeuralPanel } from "./components/NeuralPanel";
import { Tutorial } from "./components/Tutorial";

const firstSnapshot = (engine: GameEngine): GameSnapshot => engine.getSnapshot();

export function App() {
  const persisted = useMemo(() => loadState(), []);
  const initialSettings = useMemo(
    () => persisted.checkpoint?.config ?? { ...DEFAULT_CONFIG, ...persisted.settings },
    [persisted],
  );
  const initialHumanEngine = useMemo(() => new GameEngine(initialSettings.seed + 1), [initialSettings.seed]);
  const initialEvolutionEngine = useMemo(
    () => new EvolutionEngine(initialSettings, persisted.checkpoint),
    [initialSettings, persisted.checkpoint],
  );
  const humanEngineRef = useRef(initialHumanEngine);
  const evolutionRef = useRef(initialEvolutionEngine);
  const challengeRef = useRef<GameEngine | undefined>(undefined);
  const modeRef = useRef<GameMode>("manual");
  const pausedRef = useRef(true);
  const speedRef = useRef(2);
  const autoRef = useRef(true);
  const manualFinishedRef = useRef(false);

  const [mode, setMode] = useState<GameMode>("manual");
  const [snapshot, setSnapshot] = useState(() => firstSnapshot(initialHumanEngine));
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [autoEvolve, setAutoEvolve] = useState(true);
  const [humanBest, setHumanBest] = useState(persisted.humanBest);
  const [tutorialStep, setTutorialStep] = useState(persisted.tutorialStep);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [generation, setGeneration] = useState(initialEvolutionEngine.generation);
  const [history, setHistory] = useState<GenerationStats[]>([...initialEvolutionEngine.history]);
  const [lastSummary, setLastSummary] = useState<GenerationStats | undefined>(history.at(-1));
  const [lineage, setLineage] = useState(initialEvolutionEngine.lineage);
  const [hasChampion, setHasChampion] = useState(Boolean(initialEvolutionEngine.champion));
  const [announcement, setAnnouncement] = useState("Manual mode ready. Press Space, click, or tap to start.");

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { autoRef.current = autoEvolve; }, [autoEvolve]);

  useEffect(() => {
    saveState({
      humanBest,
      tutorialStep,
      settings: {
        populationSize: settings.populationSize,
        mutationRate: settings.mutationRate,
        seed: settings.seed,
      },
      checkpoint: evolutionRef.current.checkpoint(),
    });
  }, [humanBest, tutorialStep, settings, generation]);

  const finishGeneration = useCallback((continueAutomatically: boolean) => {
    const stats = evolutionRef.current.nextGeneration();
    setLastSummary(stats);
    setHistory([...evolutionRef.current.history]);
    setGeneration(evolutionRef.current.generation);
    setLineage(evolutionRef.current.lineage);
    setHasChampion(Boolean(evolutionRef.current.champion));
    setSnapshot(evolutionRef.current.game.getSnapshot());
    setAnnouncement(
      `Generation ${stats.generation} finished. Best glider cleared ${stats.bestGates} ${stats.bestGates === 1 ? "gate" : "gates"}.`,
    );
    if (!continueAutomatically) setPaused(true);
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    let lastPaint = 0;

    const tick = (time: number) => {
      if (!pausedRef.current) {
        const activeMode = modeRef.current;
        const steps = activeMode === "manual" ? 1 : Math.max(1, Math.round(speedRef.current));
        let nextSnapshot: GameSnapshot;

        if (activeMode === "manual") {
          nextSnapshot = humanEngineRef.current.getSnapshot();
          for (let index = 0; index < steps && !nextSnapshot.ended; index += 1) {
            nextSnapshot = humanEngineRef.current.step(FIXED_TIMESTEP);
          }
          if (nextSnapshot.ended && !manualFinishedRef.current) {
            manualFinishedRef.current = true;
            const score = nextSnapshot.birds[0]?.gatesCleared ?? 0;
            setHumanBest((best) => Math.max(best, score));
            setPaused(true);
            setAnnouncement(`Manual run finished with ${score} gates. Evolution now has a benchmark to beat.`);
          }
        } else if (activeMode === "challenge") {
          nextSnapshot = challengeRef.current?.getSnapshot() ?? evolutionRef.current.game.getSnapshot();
          for (let index = 0; index < steps && !nextSnapshot.ended; index += 1) {
            nextSnapshot = challengeRef.current?.step(FIXED_TIMESTEP) ?? nextSnapshot;
          }
          if (nextSnapshot.ended) {
            setPaused(true);
            const score = nextSnapshot.birds[0]?.gatesCleared ?? 0;
            setAnnouncement(`Unseen-course test complete: the champion cleared ${score} gates.`);
          }
        } else {
          nextSnapshot = evolutionRef.current.game.getSnapshot();
          for (let index = 0; index < steps && !nextSnapshot.ended; index += 1) {
            nextSnapshot = evolutionRef.current.step(FIXED_TIMESTEP);
          }
          if (nextSnapshot.ended) {
            finishGeneration(autoRef.current);
            nextSnapshot = evolutionRef.current.game.getSnapshot();
          }
        }

        if (time - lastPaint > 42) {
          setSnapshot(nextSnapshot);
          lastPaint = time;
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [finishGeneration]);

  const startManual = useCallback(() => {
    const current = humanEngineRef.current.getSnapshot();
    if (current.ended || manualFinishedRef.current) {
      humanEngineRef.current = new GameEngine(settings.seed + 1);
      manualFinishedRef.current = false;
    }
    setSnapshot(humanEngineRef.current.getSnapshot());
    setPaused(false);
    humanEngineRef.current.flapHuman();
    setAnnouncement("Manual run started.");
  }, [settings.seed]);

  const handleFlap = useCallback(() => {
    if (modeRef.current !== "manual") return;
    if (pausedRef.current || humanEngineRef.current.getSnapshot().ended) startManual();
    else humanEngineRef.current.flapHuman();
  }, [startManual]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, button, select, textarea")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (modeRef.current === "manual") handleFlap();
        else setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleFlap]);

  const switchMode = (nextMode: "manual" | "evolve") => {
    setMode(nextMode);
    if (nextMode === "manual") {
      humanEngineRef.current = new GameEngine(settings.seed + 1);
      manualFinishedRef.current = false;
      setSnapshot(humanEngineRef.current.getSnapshot());
      setPaused(true);
      setAnnouncement("Manual mode ready. Press Space, click, or tap to start.");
    } else {
      setSnapshot(evolutionRef.current.game.getSnapshot());
      setPaused(false);
      setAnnouncement(`Evolution mode running generation ${evolutionRef.current.generation}.`);
    }
  };

  const stepOneFrame = () => {
    if (!paused) setPaused(true);
    let next: GameSnapshot;
    if (mode === "manual") next = humanEngineRef.current.step(FIXED_TIMESTEP);
    else if (mode === "challenge") next = challengeRef.current?.step(FIXED_TIMESTEP) ?? snapshot;
    else next = evolutionRef.current.step(FIXED_TIMESTEP);
    setSnapshot(next);
  };

  const runChallenge = () => {
    const challenge = evolutionRef.current.createChallenge();
    if (!challenge) return;
    challengeRef.current = challenge;
    setMode("challenge");
    setSnapshot(challenge.getSnapshot());
    setPaused(false);
    setAnnouncement("Testing the champion on an unseen gate sequence.");
  };

  const newExperiment = () => {
    if (!window.confirm("Start a new experiment? This clears the current evolved population.")) return;
    clearState();
    const nextConfig = { ...settings };
    evolutionRef.current = new EvolutionEngine(nextConfig);
    setGeneration(1);
    setHistory([]);
    setLastSummary(undefined);
    setLineage(undefined);
    setHasChampion(false);
    setMode("evolve");
    setSnapshot(evolutionRef.current.game.getSnapshot());
    setPaused(false);
    setAnnouncement(`New experiment started with seed ${nextConfig.seed}.`);
  };

  const updateSettings = (next: Partial<typeof settings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    evolutionRef.current.updateConfig(merged);
  };

  const rankedBirds = [...snapshot.birds].sort((a, b) => b.fitness - a.fitness);
  const championBird = rankedBirds[0];
  const nextGate = snapshot.gates.find((gate) => gate.x >= 220);
  const humanScore = mode === "manual" ? snapshot.birds[0]?.gatesCleared ?? 0 : humanBest;
  const evolutionActive = mode === "evolve" || mode === "challenge";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#lab" aria-label="Evolution Flight Lab home">
          <img src="/assets/glider.png" alt="" />
          <span><strong>EVOLUTION</strong><small>FLIGHT LAB</small></span>
        </a>
        <div className="direction-title"><span>DIRECTION</span><strong>Wind Tunnel Laboratory</strong></div>
        <div className="mode-switch" aria-label="Game mode">
          <button className={mode === "manual" ? "active" : ""} onClick={() => switchMode("manual")}>MANUAL</button>
          <button className={evolutionActive ? "active" : ""} onClick={() => switchMode("evolve")}>EVOLVE</button>
        </div>
        <div className="top-stat"><span>HUMAN BEST</span><strong>{humanBest}</strong><small>gates cleared</small></div>
        <button className="lesson-progress" onClick={() => setTutorialOpen(true)}>
          <span>LESSON PROGRESS</span>
          <strong>{Math.min(5, tutorialStep + 1)} / 5</strong>
          <i>{[0, 1, 2, 3, 4].map((step) => <b className={step <= tutorialStep ? "done" : ""} key={step} />)}</i>
          <small><BookOpen size={15} /> Open walkthrough</small>
        </button>
      </header>

      <main id="lab" className="lab-grid">
        <section className="simulation-panel" aria-labelledby="simulation-heading">
          <header className="simulation-stats">
            <div><span>{mode === "manual" ? "RUN" : mode === "challenge" ? "UNSEEN TEST" : "GENERATION"}</span><strong>{mode === "manual" ? humanScore : generation}</strong></div>
            <div><span>LIVE BEST FITNESS</span><strong className="green">{Math.round(championBird?.fitness ?? 0)}</strong></div>
            <div><span>NEXT GATE</span><strong className="blue">{Math.max(0, ((nextGate?.x ?? 220) - 220) / 10).toFixed(1)} m</strong></div>
            <div className="alive-stat"><span>ALIVE</span><strong>{snapshot.aliveCount} / {snapshot.birds.length}</strong></div>
          </header>
          <h1 id="simulation-heading" className="sr-only">Interactive flight simulation</h1>
          <GameCanvas snapshot={snapshot} mode={mode} championId={championBird?.id} onFlap={handleFlap} />
          <div className="distance-track" aria-hidden="true"><span style={{ width: `${Math.min(100, (snapshot.distance % 2400) / 24)}%` }} /></div>
          <div className="simulation-help">
            {mode === "manual" ? "SPACE · CLICK · TAP TO FLAP" : mode === "challenge" ? "UNSEEN COURSE · NO TRAINING DATA" : "EVERY GLIDER HAS A DIFFERENT 37-GENE BRAIN"}
          </div>
        </section>

        <aside className="insight-column">
          <NeuralPanel sensors={championBird?.sensors} />
          <LineagePanel lineage={lineage} />
          <section className="fitness-panel" aria-labelledby="fitness-heading">
            <div className="section-heading compact">
              <div><p className="eyebrow">GENERATION FITNESS</p><h2 id="fitness-heading">Best vs average</h2></div>
              <div className="chart-legend"><span className="best">Best</span><span className="average">Average</span></div>
            </div>
            <FitnessChart history={history} />
            <div className="chart-values"><strong>{Math.round(lastSummary?.bestFitness ?? 0)}</strong><span>best</span><strong className="green">{Math.round(lastSummary?.averageFitness ?? 0)}</strong><span>average</span></div>
          </section>
        </aside>

        <section className="control-deck" aria-label="Simulation controls">
          <button className="primary-control" onClick={() => mode === "manual" ? startManual() : setPaused((value) => !value)}>
            {paused ? <Play size={25} weight="fill" /> : <Pause size={25} weight="fill" />}
            <span>{mode === "manual" && paused ? "START" : paused ? "RUN" : "PAUSE"}</span>
          </button>
          <button className="secondary-control" onClick={stepOneFrame}><SkipForward size={24} weight="fill" /><span>STEP</span></button>
          <label className="control-field">
            <span>SIMULATION SPEED <output>{speed.toFixed(1)}×</output></span>
            <input type="range" min="0.5" max="8" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} disabled={mode === "manual"} />
          </label>
          <label className="control-field number-field">
            <span>POPULATION</span>
            <input type="number" min="10" max="200" step="10" value={settings.populationSize} onChange={(event) => updateSettings({ populationSize: Number(event.target.value) })} />
          </label>
          <label className="control-field">
            <span>MUTATION RATE <output>{Math.round(settings.mutationRate * 100)}%</output></span>
            <input type="range" min="0" max="0.3" step="0.01" value={settings.mutationRate} onChange={(event) => updateSettings({ mutationRate: Number(event.target.value) })} />
          </label>
          <label className="control-field seed-field">
            <span>TRAINING SEED</span>
            <input type="number" min="1" max="999999" value={settings.seed} onChange={(event) => updateSettings({ seed: Number(event.target.value) || 1 })} />
          </label>
          <label className="toggle-field">
            <input type="checkbox" checked={autoEvolve} onChange={(event) => setAutoEvolve(event.target.checked)} />
            <span>AUTO EVOLVE<small>Start the next generation automatically</small></span>
          </label>
          <button className="reset-control" onClick={newExperiment}><ArrowCounterClockwise size={20} /><span>NEW EXPERIMENT</span></button>
        </section>

        <section className="learning-footer">
          <div className="goal-copy">
            <span className="goal-icon"><Flask size={28} weight="duotone" /></span>
            <div><strong>What’s the goal?</strong><p>Earn fitness by staying airborne and passing gates. Fitter brains are more likely to become parents.</p></div>
          </div>
          <div className="formula-strip" aria-label="Evolution algorithm stages">
            <span><BezierCurve size={19} /> Select</span><CaretRight size={14} /><span>Crossover</span><CaretRight size={14} /><span><Sparkle size={18} /> Mutate</span><CaretRight size={14} /><span>Fly again</span>
          </div>
          {mode === "challenge" ? (
            <button className="big-cta" onClick={() => switchMode("evolve")}><ArrowRight size={30} />RETURN TO EVOLUTION</button>
          ) : mode === "manual" ? (
            <button className="big-cta" onClick={startManual}><Play size={30} weight="fill" />FLY A MANUAL RUN</button>
          ) : (
            <div className="cta-group">
              <button className="test-cta" onClick={runChallenge} disabled={!hasChampion}><Gauge size={22} />TEST CHAMPION</button>
              <button className="big-cta" onClick={() => finishGeneration(false)}><ArrowRight size={30} />EVOLVE NEXT GENERATION</button>
            </div>
          )}
        </section>
      </main>

      <p className="sr-only" aria-live="polite">{announcement}</p>
      {tutorialOpen && (
        <Tutorial
          step={tutorialStep}
          onStep={(step) => { setTutorialStep(step); }}
          onClose={() => setTutorialOpen(false)}
        />
      )}
    </div>
  );
}
