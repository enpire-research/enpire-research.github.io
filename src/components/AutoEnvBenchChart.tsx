"use client";

import type { PointerEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fullData, type ModelSeries, type ScalingSeries, type RunPoint } from "@/data/autoEnvBenchFull";

const VIEW_W = 460;
const VIEW_H = 300;
const M = { top: 20, right: 16, bottom: 34, left: 48 };
const PLOT_W = VIEW_W - M.left - M.right;
const PLOT_H = VIEW_H - M.top - M.bottom;
const animationDurationMs = 7200;
const animationHoldMs = 900;
const modelDisplay = {
  codex: { label: "Codex", sublabel: "GPT-5.5", color: "#747fff" },
  claude: { label: "Claude Code", sublabel: "Opus 4.7", color: "#df785d" },
  kimi: { label: "Kimi Code", sublabel: "Kimi K2.6", color: "var(--aeb-kimi-color)" },
} as const;

function scaleX(val: number, max: number) {
  return M.left + (val / max) * PLOT_W;
}

function scaleY(val: number, min: number, max: number) {
  return M.top + PLOT_H - ((val - min) / (max - min)) * PLOT_H;
}

function yTicks(min: number, max: number) {
  const ticks: number[] = [];
  const candidates = [0, 0.25, 0.5, 0.75, 1.0];
  for (const t of candidates) {
    if (t >= min && t <= max) ticks.push(t);
  }
  return ticks;
}

function xTicks(max: number, step: number) {
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(Number(t.toFixed(2)));
  return ticks;
}

function formatY(v: number) {
  return `${Math.round(v * 100)}%`;
}

function displayModel(item: ModelSeries) {
  const name = item.name.toLowerCase();
  if (name.includes("codex")) return modelDisplay.codex;
  if (name.includes("claude")) return modelDisplay.claude;
  if (name.includes("kimi")) return modelDisplay.kimi;
  return { label: item.label, sublabel: "", color: item.color };
}

function valueAt(points: RunPoint[], x: number) {
  if (points.length === 0) return 0;
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  if (x <= sorted[0][0]) return sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const next = sorted[i];
    if (x <= next[0]) {
      const span = next[0] - previous[0] || 1;
      const local = (x - previous[0]) / span;
      return previous[1] + (next[1] - previous[1]) * local;
    }
  }
  return sorted[sorted.length - 1][1];
}

function pointsUntil(points: RunPoint[], cutoff: number) {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const visible = sorted.filter(([x]) => x <= cutoff);
  const next = sorted.find(([x]) => x > cutoff);
  const previous = visible[visible.length - 1];

  if (previous && next && cutoff > previous[0]) {
    visible.push([cutoff, valueAt([previous, next], cutoff)]);
  }

  return visible;
}

function pathFromPoints(points: RunPoint[], xMax: number, yMin: number, yMax: number) {
  const visiblePoints = points.filter(([x]) => x <= xMax);
  if (visiblePoints.length < 2) return "";
  return visiblePoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${scaleX(x, xMax)} ${scaleY(y, yMin, yMax)}`)
    .join(" ");
}

function pathUntil(points: RunPoint[], cutoff: number, xMax: number, yMin: number, yMax: number) {
  return pathFromPoints(pointsUntil(points, Math.min(cutoff, xMax)), xMax, yMin, yMax);
}

function semBandPath(
  xs: number[],
  lower: number[],
  upper: number[],
  xMax: number,
  yMin: number,
  yMax: number
) {
  if (xs.length < 2) return "";
  let d = "";
  for (let i = 0; i < xs.length; i++) {
    d += `${i === 0 ? "M" : "L"} ${scaleX(xs[i], xMax)} ${scaleY(upper[i], yMin, yMax)}`;
  }
  for (let i = xs.length - 1; i >= 0; i--) {
    d += ` L ${scaleX(xs[i], xMax)} ${scaleY(lower[i], yMin, yMax)}`;
  }
  d += " Z";
  return d;
}

function semBandPathUntil(
  xs: number[],
  lower: number[],
  upper: number[],
  cutoff: number,
  xMax: number,
  yMin: number,
  yMax: number
) {
  const upperPoints = xs.map((x, i) => [x, upper[i]] as RunPoint);
  const lowerPoints = xs.map((x, i) => [x, lower[i]] as RunPoint);
  const visibleUpper = pointsUntil(upperPoints, Math.min(cutoff, xMax));
  const visibleLower = pointsUntil(lowerPoints, Math.min(cutoff, xMax));
  if (visibleUpper.length < 2 || visibleLower.length < 2) return "";
  return semBandPath(
    visibleUpper.map(([x]) => x),
    visibleLower.map(([, y]) => y),
    visibleUpper.map(([, y]) => y),
    xMax,
    yMin,
    yMax
  );
}

function Tooltip({
  x,
  y,
  label,
  sub,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
}) {
  return (
    <div
      className="aeb-tooltip"
      style={{
        position: "absolute",
        left: Math.min(x + 12, VIEW_W - 140),
        top: Math.max(y - 40, 0),
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <strong>{label}</strong>
      <span>{sub}</span>
    </div>
  );
}

function BaseChart({
  title,
  xMax,
  xStep,
  yMin,
  yLabel,
  children,
  progress,
  legend,
  legendPosition = "bottom",
  onScrub,
}: {
  title: string;
  xMax: number;
  xStep: number;
  yMin: number;
  yLabel: string;
  children: ReactNode;
  progress: number;
  legend?: React.ReactNode;
  legendPosition?: "bottom" | "inside-lower-right" | "inside-upper-right";
  onScrub?: (progress: number) => void;
}) {
  const yMax = 1.05;
  const cutoff = Math.max(0, Math.min(xMax, xMax * progress));
  const cursorX = scaleX(cutoff, xMax);
  const xticks = useMemo(() => xTicks(xMax, xStep), [xMax, xStep]);
  const yticks = useMemo(() => yTicks(yMin, yMax), [yMin, yMax]);
  const handleScrub = (event: PointerEvent<SVGSVGElement>) => {
    if (!onScrub) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const sx = (event.clientX - rect.left) / rect.width;
    const viewX = sx * VIEW_W;
    const next = (viewX - M.left) / PLOT_W;
    onScrub(Math.max(0, Math.min(1, next)));
  };

  return (
    <div className="aeb-chart">
      <h4 className="aeb-chart-title">{title}</h4>
      <div style={{ position: "relative" }}>
        <svg
          className="aeb-svg"
          onPointerDown={handleScrub}
          onPointerMove={(event) => {
            if (event.buttons === 1) handleScrub(event);
          }}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        >
          {/* Grid */}
          {yticks.map((t) => (
            <line
              key={`gy-${t}`}
              x1={M.left}
              y1={scaleY(t, yMin, yMax)}
              x2={M.left + PLOT_W}
              y2={scaleY(t, yMin, yMax)}
              className="aeb-grid"
            />
          ))}
          {xticks.map((t) => (
            <line
              key={`gx-${t}`}
              x1={scaleX(t, xMax)}
              y1={M.top}
              x2={scaleX(t, xMax)}
              y2={M.top + PLOT_H}
              className="aeb-grid"
            />
          ))}

          {/* Axes */}
          <line
            x1={M.left}
            y1={M.top + PLOT_H}
            x2={M.left + PLOT_W}
            y2={M.top + PLOT_H}
            className="aeb-axis"
          />
          <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + PLOT_H} className="aeb-axis" />

          {/* X ticks */}
          {xticks.map((t) => (
            <g key={`xt-${t}`}>
              <line
                x1={scaleX(t, xMax)}
                y1={M.top + PLOT_H}
                x2={scaleX(t, xMax)}
                y2={M.top + PLOT_H + 4}
                className="aeb-axis"
              />
              <text
                x={scaleX(t, xMax)}
                y={M.top + PLOT_H + 16}
                textAnchor="middle"
                className="aeb-tick"
              >
                {t}
              </text>
            </g>
          ))}

          {/* Y ticks */}
          {yticks.map((t) => (
            <g key={`yt-${t}`}>
              <line
                x1={M.left - 4}
                y1={scaleY(t, yMin, yMax)}
                x2={M.left}
                y2={scaleY(t, yMin, yMax)}
                className="aeb-axis"
              />
              <text
                x={M.left - 8}
                y={scaleY(t, yMin, yMax) + 4}
                textAnchor="end"
                className="aeb-tick"
              >
                {formatY(t)}
              </text>
            </g>
          ))}

          <text
            x={M.left}
            y={M.top - 6}
            textAnchor="start"
            className="aeb-axis-label"
          >
            {yLabel}
          </text>
          <text
            x={M.left + PLOT_W}
            y={M.top + PLOT_H - 7}
            textAnchor="end"
            className="aeb-axis-label"
          >
            Research Time (h)
          </text>

          {children}
          <g className="aeb-time-cursor">
            <line x1={cursorX} y1={M.top} x2={cursorX} y2={M.top + PLOT_H} />
            <text x={Math.min(cursorX + 8, M.left + PLOT_W - 38)} y={M.top + 16}>
              {cutoff.toFixed(xMax <= 2 ? 1 : 0)}h
            </text>
          </g>
        </svg>

        {/* Inside legend overlays */}
        {legend && legendPosition === "inside-lower-right" && (
          <div className="aeb-legend-overlay aeb-legend-overlay--lower-right">{legend}</div>
        )}
        {legend && legendPosition === "inside-upper-right" && (
          <div className="aeb-legend-overlay aeb-legend-overlay--upper-right">{legend}</div>
        )}
      </div>
      {legend && legendPosition === "bottom" && <div className="aeb-legend">{legend}</div>}
    </div>
  );
}

function ModelComparePanel({
  title,
  series,
  xMax,
  xStep,
  yMin,
  yLabel,
  progress,
  selectedAgent,
  onSelectAgent,
  onScrub,
}: {
  title: string;
  series: ModelSeries[];
  xMax: number;
  xStep: number;
  yMin: number;
  yLabel: string;
  progress: number;
  selectedAgent: string | null;
  onSelectAgent: (agent: string | null) => void;
  onScrub: (progress: number) => void;
}) {
  const [hover, setHover] = useState<{ x: number; y: number; label: string; sub: string } | null>(null);
  const cutoff = xMax * progress;
  const isDimmed = (name: string) => selectedAgent !== null && !name.toLowerCase().includes(selectedAgent);

  return (
    <BaseChart
      title={title}
      xMax={xMax}
      xStep={xStep}
      yMin={yMin}
      yLabel={yLabel}
      progress={progress}
      onScrub={onScrub}
    >
      {/* Raw run lines */}
      {series.map((item) =>
        item.runs.map((run, ri) => (
          <path
            key={`runline-${item.name}-${ri}`}
            d={pathUntil(run, cutoff, xMax, yMin, 1.05)}
            fill="none"
            stroke={displayModel(item).color}
            strokeWidth={1}
            opacity={isDimmed(item.name) ? 0.04 : 0.15}
            style={{ cursor: "pointer" }}
            onClick={() => onSelectAgent(selectedAgent === item.name.toLowerCase() ? null : item.name.toLowerCase())}
          />
        ))
      )}

      {/* Raw scatter points */}
      {series.map((item) =>
        item.raw_scatter.map(([xh, yv], i) => {
          if (xh > xMax || xh > cutoff) return null;
          const cx = scaleX(xh, xMax);
          const cy = scaleY(yv, yMin, 1.05);
          return (
            <circle
              key={`sc-${item.name}-${i}`}
              cx={cx}
              cy={cy}
              r={2}
              fill={displayModel(item).color}
              fillOpacity={isDimmed(item.name) ? 0.08 : 0.25}
              stroke="white"
              strokeWidth={0.5}
              strokeOpacity={0.4}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectAgent(selectedAgent === item.name.toLowerCase() ? null : item.name.toLowerCase())}
              onMouseEnter={() =>
                setHover({
                  x: cx,
                  y: cy,
                  label: displayModel(item).label,
                  sub: `${xh.toFixed(2)}h · ${formatY(yv)}`,
                })
              }
              onMouseLeave={() => setHover(null)}
            />
          );
        })
      )}

      {/* SEM bands at highlight points */}
      {series.map((item) => (
        <path
          key={`band-${item.name}`}
          d={semBandPathUntil(
            item.highlight_xs,
            item.highlight_lower,
            item.highlight_upper,
            cutoff,
            xMax,
            yMin,
            1.05
          )}
          fill={displayModel(item).color}
          fillOpacity={isDimmed(item.name) ? 0.025 : 0.1}
          stroke="none"
          style={{ cursor: "pointer" }}
          onClick={() => onSelectAgent(selectedAgent === item.name.toLowerCase() ? null : item.name.toLowerCase())}
        />
      ))}

      {/* Mean lines at highlight points */}
      {series.map((item) => (
        <path
          key={`mean-${item.name}`}
          d={pathUntil(
            item.highlight_xs.map((x, i) => [x, item.highlight_mean[i]]),
            cutoff,
            xMax,
            yMin,
            1.05
          )}
          fill="none"
          stroke={displayModel(item).color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isDimmed(item.name) ? 0.18 : 0.95}
          style={{ cursor: "pointer" }}
          onClick={() => onSelectAgent(selectedAgent === item.name.toLowerCase() ? null : item.name.toLowerCase())}
        />
      ))}

      {/* Moving cursor intersections */}
      {series.map((item) => {
        const points = item.highlight_xs.map((x, i) => [x, item.highlight_mean[i]] as RunPoint);
        const firstX = points[0]?.[0] ?? 0;
        if (cutoff < firstX) return null;
        const cx = scaleX(cutoff, xMax);
        const yv = valueAt(points, cutoff);
        const cy = scaleY(yv, yMin, 1.05);
        return (
          <circle
            key={`cursor-dot-${item.name}`}
            className="aeb-cursor-dot"
            cx={cx}
            cy={cy}
            fill={displayModel(item).color}
            opacity={isDimmed(item.name) ? 0.22 : 1}
            r={5.5}
            stroke="white"
            strokeWidth={1.25}
            onClick={() => onSelectAgent(selectedAgent === item.name.toLowerCase() ? null : item.name.toLowerCase())}
            onMouseEnter={() =>
              setHover({
                x: cx,
                y: cy,
                label: `${displayModel(item).label} at cursor`,
                sub: `${cutoff.toFixed(2)}h · ${formatY(yv)}`,
              })
            }
            onMouseLeave={() => setHover(null)}
          />
        );
      })}

      {/* Highlight markers */}
      {series.map((item) =>
        item.highlight_xs.map((hx, i) => {
          if (hx > cutoff) return null;
          const cx = scaleX(hx, xMax);
          const cy = scaleY(item.highlight_mean[i], yMin, 1.05);
          return (
            <circle
              key={`hl-${item.name}-${i}`}
              cx={cx}
              cy={cy}
              r={6}
              fill={displayModel(item).color}
              stroke="white"
              strokeWidth={1.2}
              opacity={isDimmed(item.name) ? 0.22 : 1}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectAgent(selectedAgent === item.name.toLowerCase() ? null : item.name.toLowerCase())}
              onMouseEnter={() =>
                setHover({
                  x: cx,
                  y: cy,
                  label: `${displayModel(item).label} (mean)`,
                  sub: `${hx.toFixed(2)}h · ${formatY(item.highlight_mean[i])}`,
                })
              }
              onMouseLeave={() => setHover(null)}
            />
          );
        })
      )}

      {hover && <Tooltip x={hover.x} y={hover.y} label={hover.label} sub={hover.sub} />}
    </BaseChart>
  );
}

function ScalingPanel({
  title,
  series,
  xMax,
  xStep,
  yMin,
  yLabel,
  progress,
  selectedTeam,
  onSelectTeam,
  onScrub,
}: {
  title: string;
  series: ScalingSeries[];
  xMax: number;
  xStep: number;
  yMin: number;
  yLabel: string;
  progress: number;
  selectedTeam: string | null;
  onSelectTeam: (team: string | null) => void;
  onScrub: (progress: number) => void;
}) {
  const [hover, setHover] = useState<{ x: number; y: number; label: string; sub: string } | null>(null);
  const cutoff = xMax * progress;
  const isDimmed = (key: string) => selectedTeam !== null && selectedTeam !== key;

  function markerShape(cx: number, cy: number, color: string, shape: string) {
    if (shape === "triangle") {
      return (
        <polygon
          points={`${cx},${cy - 5} ${cx - 4.5},${cy + 4} ${cx + 4.5},${cy + 4}`}
          fill={color}
          stroke="white"
          strokeWidth={1}
        />
      );
    }
    if (shape === "square") {
      return (
        <rect
          x={cx - 4}
          y={cy - 4}
          width={8}
          height={8}
          fill={color}
          stroke="white"
          strokeWidth={1}
        />
      );
    }
    return (
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={1} />
    );
  }

  return (
    <BaseChart
      title={title}
      xMax={xMax}
      xStep={xStep}
      yMin={yMin}
      yLabel={yLabel}
      progress={progress}
      onScrub={onScrub}
    >
      {/* Lines */}
      {series.map((item) => (
        <path
          key={`line-${item.key}`}
          d={pathUntil(item.points, cutoff, xMax, yMin, 1.05)}
          fill="none"
          stroke={item.color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isDimmed(item.key) ? 0.18 : 0.95}
          style={{ cursor: "pointer" }}
          onClick={() => onSelectTeam(selectedTeam === item.key ? null : item.key)}
        />
      ))}

      {/* Moving cursor intersections */}
      {series.map((item) => {
        const firstX = item.points[0]?.[0] ?? 0;
        if (cutoff < firstX) return null;
        const cx = scaleX(cutoff, xMax);
        const yv = valueAt(item.points, cutoff);
        const cy = scaleY(yv, yMin, 1.05);
        return (
          <circle
            key={`cursor-dot-${item.key}`}
            className="aeb-cursor-dot"
            cx={cx}
            cy={cy}
            fill={item.color}
            opacity={isDimmed(item.key) ? 0.22 : 1}
            r={5.5}
            stroke="white"
            strokeWidth={1.25}
            onClick={() => onSelectTeam(selectedTeam === item.key ? null : item.key)}
            onMouseEnter={() =>
              setHover({
                x: cx,
                y: cy,
                label: `${item.name} at cursor`,
                sub: `${cutoff.toFixed(2)}h · ${formatY(yv)}`,
              })
            }
            onMouseLeave={() => setHover(null)}
          />
        );
      })}

      {/* Markers */}
      {series.map((item) => {
        const shape = item.key === "agent1" ? "circle" : item.key === "agent4" ? "triangle" : "square";
        return item.points.map(([xh, yv], i) => {
          if (xh > xMax || xh > cutoff) return null;
          const cx = scaleX(xh, xMax);
          const cy = scaleY(yv, yMin, 1.05);
          return (
            <g
              key={`mk-${item.key}-${i}`}
              opacity={isDimmed(item.key) ? 0.22 : 1}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectTeam(selectedTeam === item.key ? null : item.key)}
              onMouseEnter={() =>
                setHover({
                  x: cx,
                  y: cy,
                  label: item.name,
                  sub: `${xh.toFixed(2)}h · ${formatY(yv)}`,
                })
              }
              onMouseLeave={() => setHover(null)}
            >
              {markerShape(cx, cy, item.color, shape)}
            </g>
          );
        });
      })}

      {hover && <Tooltip x={hover.x} y={hover.y} label={hover.label} sub={hover.sub} />}
    </BaseChart>
  );
}

export default function AutoEnvBenchChart({ figureNumber }: { figureNumber: number }) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const progressRef = useRef(0);
  const modelLegend = fullData.pushtModel.map(displayModel);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (isPaused) return;
    const cycleMs = animationDurationMs + animationHoldMs;
    let frameId = 0;
    const start = performance.now() - progressRef.current * animationDurationMs;

    const tick = (timestamp: number) => {
      const elapsed = (timestamp - start) % cycleMs;
      const raw = Math.min(1, elapsed / animationDurationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(eased);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPaused]);

  const handleScrub = (next: number) => {
    setIsPaused(true);
    setProgress(next);
  };

  return (
    <figure className="aeb-figure aeb-figure--agent">
      <div className="aeb-controls" aria-label="Agent comparison timeline controls">
        <button className="aeb-control-button" onClick={() => setIsPaused((paused) => !paused)} type="button">
          {isPaused ? "Play" : "Pause"}
        </button>
        <input
          aria-label="Research time"
          className="aeb-progress"
          max="1"
          min="0"
          onChange={(event) => handleScrub(Number(event.currentTarget.value))}
          step="0.001"
          type="range"
          value={progress}
        />
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="aeb-task-stack aeb-task-stack--two-up">
        <section className="aeb-task-row" aria-label="Push-T heuristic learning results">
          <h3 className="aeb-task-title">Push-T (Heuristic Learning)</h3>
          <div className="aeb-task-panel">
            <div className="aeb-chart-pair aeb-chart-pair--single">
              <ModelComparePanel
                title="Push-T model comparison"
                series={fullData.pushtModel}
                xMax={8.0}
                xStep={2.0}
                yMin={0}
                yLabel="Normalized Score"
                progress={progress}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                onScrub={handleScrub}
              />
            </div>
          </div>
        </section>

        <section className="aeb-task-row" aria-label="Pin Insertion gradient-based learning results">
          <h3 className="aeb-task-title">Pin Insertion (Gradient-based Learning)</h3>
          <div className="aeb-task-panel">
            <div className="aeb-chart-pair aeb-chart-pair--single">
              <ModelComparePanel
                title="Pin Insertion model comparison"
                series={fullData.pinModel}
                xMax={4.0}
                xStep={1.0}
                yMin={0.3}
                yLabel="Success Rate"
                progress={progress}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                onScrub={handleScrub}
              />
            </div>
          </div>
        </section>
      </div>
      <div className="aeb-global-legend" aria-label="AutoEnvBench legend">
        <strong>Agent:</strong>
        {modelLegend.map((item) => (
          <button
            className="aeb-global-legend__agent"
            data-active={selectedAgent === item.label.toLowerCase() || selectedAgent === item.label.toLowerCase().replace(" code", "")}
            key={item.label}
            onClick={() => {
              const key = item.label.toLowerCase().replace(" code", "");
              setSelectedAgent(selectedAgent === key ? null : key);
            }}
            type="button"
          >
            <svg width="42" height="10" viewBox="0 0 42 10" aria-hidden="true">
              <line x1="4" y1="5" x2="38" y2="5" stroke={item.color} strokeLinecap="round" strokeWidth="3" />
            </svg>
            <span>
              {item.label}
              <small>{item.sublabel}</small>
            </span>
          </button>
        ))}
      </div>
      <figcaption className="aeb-caption">
        Figure {figureNumber}: Coding-agent comparison on AutoEnvBench, measuring agent-driven research progress across
        Push-T and Pin Insertion.
      </figcaption>
    </figure>
  );
}

export function AutoEnvBenchScalingChart({ figureNumber }: { figureNumber: number }) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const progressRef = useRef(0);
  const teamLegend = fullData.pushtScaling.map((item) => ({
    key: item.key,
    label: item.key === "agent1" ? "1 agent" : item.key === "agent4" ? "4 agents" : "8 agents",
    color: item.color,
  }));

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (isPaused) return;
    const cycleMs = animationDurationMs + animationHoldMs;
    let frameId = 0;
    const start = performance.now() - progressRef.current * animationDurationMs;

    const tick = (timestamp: number) => {
      const elapsed = (timestamp - start) % cycleMs;
      const raw = Math.min(1, elapsed / animationDurationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(eased);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPaused]);

  const handleScrub = (next: number) => {
    setIsPaused(true);
    setProgress(next);
  };

  return (
    <figure className="aeb-figure aeb-figure--scaling">
      <div className="aeb-controls" aria-label="Team scaling timeline controls">
        <button className="aeb-control-button" onClick={() => setIsPaused((paused) => !paused)} type="button">
          {isPaused ? "Play" : "Pause"}
        </button>
        <input
          aria-label="Research time"
          className="aeb-progress"
          max="1"
          min="0"
          onChange={(event) => handleScrub(Number(event.currentTarget.value))}
          step="0.001"
          type="range"
          value={progress}
        />
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="aeb-task-stack aeb-task-stack--two-up">
        <section className="aeb-task-row" aria-label="Push-T team scaling results">
          <h3 className="aeb-task-title">Push-T Scaling</h3>
          <div className="aeb-task-panel">
            <div className="aeb-chart-pair aeb-chart-pair--single">
              <ScalingPanel
                title="Push-T team scaling"
                series={fullData.pushtScaling}
                xMax={5.0}
                xStep={1.0}
                yMin={0}
                yLabel="Normalized Score"
                progress={progress}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                onScrub={handleScrub}
              />
            </div>
          </div>
        </section>

        <section className="aeb-task-row" aria-label="Pin Insertion team scaling results">
          <h3 className="aeb-task-title">Pin Insertion Scaling</h3>
          <div className="aeb-task-panel">
            <div className="aeb-chart-pair aeb-chart-pair--single">
              <ScalingPanel
                title="Pin Insertion team scaling"
                series={fullData.pinScaling}
                xMax={1.5}
                xStep={0.5}
                yMin={0}
                yLabel="Success Rate"
                progress={progress}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                onScrub={handleScrub}
              />
            </div>
          </div>
        </section>
      </div>
      <div className="aeb-global-legend" aria-label="AutoEnvBench scaling legend">
        <strong>Team size:</strong>
        {teamLegend.map((item) => (
          <button
            className="aeb-global-legend__team"
            data-active={selectedTeam === item.key}
            key={item.key}
            onClick={() => setSelectedTeam(selectedTeam === item.key ? null : item.key)}
            type="button"
          >
            <svg width="13" height="13" viewBox="0 0 18 18" aria-hidden="true">
              {item.key === "agent1" ? (
                <circle cx="9" cy="9" r="7" fill={item.color} />
              ) : item.key === "agent4" ? (
                <polygon points="9,2 16,16 2,16" fill={item.color} />
              ) : (
                <rect x="3" y="3" width="14" height="14" fill={item.color} />
              )}
            </svg>
            {item.label}
          </button>
        ))}
      </div>
      <figcaption className="aeb-caption">
        Figure {figureNumber}: Scaling-law view for AutoEnvBench, comparing one-, four-, and eight-agent research teams
        across Push-T and Pin Insertion.
      </figcaption>
    </figure>
  );
}
