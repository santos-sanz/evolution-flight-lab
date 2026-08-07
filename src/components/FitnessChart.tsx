import { useEffect, useRef } from "react";
import type { GenerationStats } from "../types";

export function FitnessChart({ history }: { history: GenerationStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(300, rect.width * ratio);
    canvas.height = Math.max(132, rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(35, 68, 111, 0.12)";
    context.lineWidth = 1;
    for (let row = 1; row <= 3; row += 1) {
      const y = (height / 4) * row;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    const points = history.length ? history.slice(-20) : [{ generation: 1, bestFitness: 0, averageFitness: 0, bestGates: 0, championId: "" }];
    const max = Math.max(1, ...points.map((point) => point.bestFitness));
    const draw = (key: "bestFitness" | "averageFitness", color: string) => {
      context.strokeStyle = color;
      context.lineWidth = 2.5;
      context.lineJoin = "round";
      context.beginPath();
      points.forEach((point, index) => {
        const x = points.length === 1 ? 0 : (index / (points.length - 1)) * (width - 10) + 5;
        const y = height - 9 - (point[key] / max) * (height - 22);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    };
    draw("bestFitness", "#1564eb");
    draw("averageFitness", "#15975c");
  }, [history]);

  return <canvas className="fitness-chart" ref={canvasRef} aria-label="Best and average fitness by generation" />;
}
