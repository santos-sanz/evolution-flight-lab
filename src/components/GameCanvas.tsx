import { useEffect, useRef } from "react";
import type { GameMode, GameSnapshot } from "../types";
import { BIRD_X, WORLD_HEIGHT, WORLD_WIDTH } from "../engine/game";

interface GameCanvasProps {
  snapshot: GameSnapshot;
  mode: GameMode;
  championId?: string;
  onFlap: () => void;
}

const gliderImage = new Image();
gliderImage.src = "/assets/glider.png";
const gateImage = new Image();
gateImage.src = "/assets/gate.png";
const backgroundImage = new Image();
backgroundImage.src = "/assets/wind-tunnel.webp";

export function GameCanvas({ snapshot, mode, championId, onFlap }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_WIDTH * ratio;
    canvas.height = WORLD_HEIGHT * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    if (backgroundImage.complete) {
      context.drawImage(backgroundImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      context.fillStyle = "#eef7ff";
      context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }

    const wash = context.createLinearGradient(0, 0, WORLD_WIDTH, 0);
    wash.addColorStop(0, "rgba(239, 248, 255, 0.2)");
    wash.addColorStop(0.55, "rgba(255, 255, 255, 0.04)");
    wash.addColorStop(1, "rgba(232, 244, 255, 0.2)");
    context.fillStyle = wash;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    context.save();
    context.strokeStyle = "rgba(21, 100, 232, 0.1)";
    context.lineWidth = 1;
    for (let y = 110; y < WORLD_HEIGHT; y += 110) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(WORLD_WIDTH, y);
      context.stroke();
    }
    context.restore();

    for (const gate of snapshot.gates) {
      if (gate.x < -100 || gate.x > WORLD_WIDTH + 120) continue;
      const height = 430;
      const width = 130;
      context.save();
      context.globalAlpha = 0.96;
      context.drawImage(gateImage, gate.x - width / 2, gate.openingY - height / 2, width, height);
      context.restore();
    }

    const aliveBirds = snapshot.birds.filter((bird) => bird.alive);
    const visibleBirds = mode === "manual" ? snapshot.birds.slice(0, 1) : aliveBirds.slice(0, 60);
    for (const bird of visibleBirds) {
      const isChampion = bird.id === championId || (mode !== "evolve" && bird.id === snapshot.birds[0]?.id);
      context.save();
      context.translate(BIRD_X, bird.y);
      context.rotate(Math.max(-0.34, Math.min(0.48, bird.velocity / 700)));
      context.globalAlpha = bird.alive ? (isChampion ? 1 : 0.24) : 0.1;
      if (!isChampion) context.filter = `hue-rotate(${bird.hue}deg)`;
      const width = isChampion ? 76 : 54;
      const height = width * 0.515;
      context.drawImage(gliderImage, -width / 2, -height / 2, width, height);
      if (isChampion) {
        context.filter = "none";
        context.strokeStyle = "rgba(20, 99, 235, 0.9)";
        context.lineWidth = 2;
        context.beginPath();
        context.arc(0, 0, 48, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
    }

    const nextGate = snapshot.gates.find((gate) => gate.x >= BIRD_X);
    if (nextGate) {
      context.save();
      context.strokeStyle = "rgba(21, 100, 232, 0.52)";
      context.setLineDash([7, 8]);
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(nextGate.x, Math.max(20, nextGate.openingY - nextGate.openingRadius));
      context.lineTo(nextGate.x, Math.min(WORLD_HEIGHT - 20, nextGate.openingY + nextGate.openingRadius));
      context.stroke();
      context.restore();
    }
  }, [snapshot, mode, championId]);

  return (
    <div className="game-canvas-wrap">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        onPointerDown={onFlap}
        role="img"
        aria-label={`${mode === "manual" ? "Manual flight" : "Evolution simulation"}. ${snapshot.aliveCount} gliders alive.`}
      />
      <div className="wind-indicator" aria-hidden="true">
        <span>WIND</span>
        <strong>6.5 m/s</strong>
      </div>
      <div className="canvas-start-label" aria-hidden="true">START</div>
    </div>
  );
}
