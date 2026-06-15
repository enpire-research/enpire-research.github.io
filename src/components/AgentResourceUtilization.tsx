"use client";

import { useState } from "react";
import { agentResourceData } from "@/data/agentResourceUtilization";

const VIEW_W = 420;
const VIEW_H = 300;
const M = { top: 20, right: 40, bottom: 56, left: 56 };
const PLOT_W = VIEW_W - M.left - M.right;
const PLOT_H = VIEW_H - M.top - M.bottom;

type HoverInfo = {
  x: number;
  y: number;
  label: string;
  sub: string;
};

function scaleY(val: number, min: number, max: number) {
  return M.top + PLOT_H - ((val - min) / (max - min)) * PLOT_H;
}

function Tooltip({ x, y, label, sub }: HoverInfo) {
  return (
    <div
      className="aru-tooltip"
      style={{
        left: Math.min(x + 14, VIEW_W - 140),
        top: Math.max(y - 40, 0),
      }}
    >
      <strong>{label}</strong>
      <span>{sub}</span>
    </div>
  );
}

const CATEGORIES = ["1 agent", "4 agents", "8 agents"];

function ResourceLegend() {
  return (
    <div className="aru-legend" aria-label="Agent resource utilization legend">
      <span className="aru-legend-group">Bars</span>
      <span className="aru-legend-item">
        <svg width="16" height="12" viewBox="0 0 16 12">
          <rect x="2" y="2" width="10" height="8" fill="#9fbe8d" className="aru-bar-stroke" rx="1" />
        </svg>
        Robot / tokens
      </span>
      <span className="aru-legend-item">
        <svg width="16" height="12" viewBox="0 0 16 12">
          <rect x="2" y="2" width="10" height="8" fill="#5f82ad" className="aru-bar-stroke" rx="1" />
        </svg>
        GPU / observed throughput
      </span>
      <span className="aru-legend-group">Reference</span>
      <span className="aru-legend-item">
        <svg width="32" height="12" viewBox="0 0 32 12">
          <rect x="3" y="3" width="24" height="6" className="aru-projection-band" rx="3" />
          <line x1="3" y1="6" x2="27" y2="6" strokeWidth="2" strokeLinecap="round" className="aru-projection-line" strokeDasharray="5 4" />
        </svg>
        Linear projection ±10%
      </span>
      <span className="aru-legend-item">
        <svg width="32" height="12" viewBox="0 0 32 12">
          <line x1="3" y1="6" x2="27" y2="6" strokeWidth="2" strokeLinecap="round" className="aru-projection-line" />
          <circle cx="15" cy="6" r="3" className="aru-overlay-circle" />
        </svg>
        Time to success
      </span>
    </div>
  );
}

/* ---------- Panel (a): Mean Resource Utilization ---------- */
function PanelA() {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const data = agentResourceData.utilization;
  const yMin = 0;
  const yMax = 100;
  const yTicks = [0, 25, 50, 75, 100];
  const groupWidth = PLOT_W / data.length;
  const barWidth = groupWidth * 0.35;

  return (
    <div className="aru-panel">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} onMouseLeave={() => setHover(null)}>
        {/* Horizontal grid */}
        {yTicks.map((t) => (
          <line
            key={`g-${t}`}
            x1={M.left}
            y1={scaleY(t, yMin, yMax)}
            x2={M.left + PLOT_W}
            y2={scaleY(t, yMin, yMax)}
            className="aru-grid-line"
          />
        ))}

        {/* Axes */}
        <line
          x1={M.left}
          y1={M.top + PLOT_H}
          x2={M.left + PLOT_W}
          y2={M.top + PLOT_H}
          className="aru-axis"
        />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + PLOT_H} className="aru-axis" />

        {/* X ticks */}
        {data.map((d, i) => {
          const x = M.left + (i + 0.5) * groupWidth;
          return (
            <g key={`xt-${d.agentCount}`}>
              <line x1={x} y1={M.top + PLOT_H} x2={x} y2={M.top + PLOT_H + 4} className="aru-axis" />
              <text x={x} y={M.top + PLOT_H + 16} textAnchor="middle" className="aru-tick">
                {CATEGORIES[i]}
              </text>
            </g>
          );
        })}

        {/* Y ticks */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line
              x1={M.left - 4}
              y1={scaleY(t, yMin, yMax)}
              x2={M.left}
              y2={scaleY(t, yMin, yMax)}
              className="aru-axis"
            />
            <text x={M.left - 8} y={scaleY(t, yMin, yMax) + 4} textAnchor="end" className="aru-tick">
              {t}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={M.left + PLOT_W / 2} y={VIEW_H - 4} textAnchor="middle" className="aru-axis-label">
          (a) Mean Resource Utilization
        </text>
        <text
          x={14}
          y={M.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${M.top + PLOT_H / 2})`}
          className="aru-axis-label"
        >
          Utilization (%)
        </text>

        {/* Bars + error bars */}
        {data.map((d, i) => {
          const cx = M.left + (i + 0.5) * groupWidth;
          const robotX = cx - barWidth - 2;
          const gpuX = cx + 2;
          const robotY = scaleY(d.robotMean, yMin, yMax);
          const gpuY = scaleY(d.gpuMean, yMin, yMax);
          const robotH = M.top + PLOT_H - robotY;
          const gpuH = M.top + PLOT_H - gpuY;

          return (
            <g key={`bars-${d.agentCount}`}>
              <rect
                x={robotX}
                y={robotY}
                width={barWidth}
                height={robotH}
                fill="#9fbe8d"
                className="aru-bar aru-bar-stroke"
                rx={1}
                onMouseEnter={() =>
                  setHover({
                    x: robotX + barWidth / 2,
                    y: robotY,
                    label: `Robot · ${d.agentCount} agent${d.agentCount > 1 ? "s" : ""}`,
                    sub: `${d.robotMean.toFixed(1)}% ± ${d.robotStd.toFixed(1)}%`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
              {/* Robot error bar */}
              <line
                x1={robotX + barWidth / 2}
                y1={scaleY(d.robotMean + d.robotStd, yMin, yMax)}
                x2={robotX + barWidth / 2}
                y2={scaleY(Math.max(d.robotMean - d.robotStd, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={robotX + barWidth / 2 - 3}
                y1={scaleY(d.robotMean + d.robotStd, yMin, yMax)}
                x2={robotX + barWidth / 2 + 3}
                y2={scaleY(d.robotMean + d.robotStd, yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={robotX + barWidth / 2 - 3}
                y1={scaleY(Math.max(d.robotMean - d.robotStd, yMin), yMin, yMax)}
                x2={robotX + barWidth / 2 + 3}
                y2={scaleY(Math.max(d.robotMean - d.robotStd, yMin), yMin, yMax)}
                className="aru-error-bar"
              />

              <rect
                x={gpuX}
                y={gpuY}
                width={barWidth}
                height={gpuH}
                fill="#5f82ad"
                className="aru-bar aru-bar-stroke"
                rx={1}
                onMouseEnter={() =>
                  setHover({
                    x: gpuX + barWidth / 2,
                    y: gpuY,
                    label: `GPU · ${d.agentCount} agent${d.agentCount > 1 ? "s" : ""}`,
                    sub: `${d.gpuMean.toFixed(1)}% ± ${d.gpuStd.toFixed(1)}%`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
              {/* GPU error bar */}
              <line
                x1={gpuX + barWidth / 2}
                y1={scaleY(d.gpuMean + d.gpuStd, yMin, yMax)}
                x2={gpuX + barWidth / 2}
                y2={scaleY(Math.max(d.gpuMean - d.gpuStd, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={gpuX + barWidth / 2 - 3}
                y1={scaleY(d.gpuMean + d.gpuStd, yMin, yMax)}
                x2={gpuX + barWidth / 2 + 3}
                y2={scaleY(d.gpuMean + d.gpuStd, yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={gpuX + barWidth / 2 - 3}
                y1={scaleY(Math.max(d.gpuMean - d.gpuStd, yMin), yMin, yMax)}
                x2={gpuX + barWidth / 2 + 3}
                y2={scaleY(Math.max(d.gpuMean - d.gpuStd, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
            </g>
          );
        })}
      </svg>
      {hover && <Tooltip {...hover} />}
    </div>
  );
}

/* ---------- Panel (b): Mean Token Utilization ---------- */
function PanelB() {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const data = agentResourceData.tokenRate;
  const baseline = data[0].mean;
  const projection = data.map((d) => baseline * d.agentCount);
  const yMin = 0;
  const yMax = 170000;
  const yTicks = [0, 50000, 100000, 150000];
  const groupWidth = PLOT_W / data.length;
  const barWidth = groupWidth * 0.5;

  const linePath = data
    .map((d, i) => {
      const x = M.left + (i + 0.5) * groupWidth;
      const y = scaleY(projection[i], yMin, yMax);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const projectionBandPath = [
    ...data.map((d, i) => {
      const x = M.left + (i + 0.5) * groupWidth;
      const y = scaleY(projection[i] * 1.1, yMin, yMax);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }),
    ...[...data].reverse().map((d, reverseIndex) => {
      const i = data.length - 1 - reverseIndex;
      const x = M.left + (i + 0.5) * groupWidth;
      const y = scaleY(projection[i] * 0.9, yMin, yMax);
      return `L ${x} ${y}`;
    }),
    "Z",
  ].join(" ");

  const formatTick = (t: number) => (t >= 1000 ? `${t / 1000}k` : `${t}`);

  return (
    <div className="aru-panel">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} onMouseLeave={() => setHover(null)}>
        {/* Horizontal grid */}
        {yTicks.map((t) => (
          <line
            key={`g-${t}`}
            x1={M.left}
            y1={scaleY(t, yMin, yMax)}
            x2={M.left + PLOT_W}
            y2={scaleY(t, yMin, yMax)}
            className="aru-grid-line"
          />
        ))}

        {/* Axes */}
        <line
          x1={M.left}
          y1={M.top + PLOT_H}
          x2={M.left + PLOT_W}
          y2={M.top + PLOT_H}
          className="aru-axis"
        />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + PLOT_H} className="aru-axis" />

        {/* X ticks */}
        {data.map((d, i) => {
          const x = M.left + (i + 0.5) * groupWidth;
          return (
            <g key={`xt-${d.agentCount}`}>
              <line x1={x} y1={M.top + PLOT_H} x2={x} y2={M.top + PLOT_H + 4} className="aru-axis" />
              <text x={x} y={M.top + PLOT_H + 16} textAnchor="middle" className="aru-tick">
                {CATEGORIES[i]}
              </text>
            </g>
          );
        })}

        {/* Y ticks */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line
              x1={M.left - 4}
              y1={scaleY(t, yMin, yMax)}
              x2={M.left}
              y2={scaleY(t, yMin, yMax)}
              className="aru-axis"
            />
            <text x={M.left - 8} y={scaleY(t, yMin, yMax) + 4} textAnchor="end" className="aru-tick">
              {formatTick(t)}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={M.left + PLOT_W / 2} y={VIEW_H - 4} textAnchor="middle" className="aru-axis-label">
          (b) Mean Token Utilization
        </text>
        <text
          x={14}
          y={M.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${M.top + PLOT_H / 2})`}
          className="aru-axis-label"
        >
          MTU
        </text>

        {/* Bars + error bars */}
        {data.map((d, i) => {
          const cx = M.left + (i + 0.5) * groupWidth;
          const x = cx - barWidth / 2;
          const y = scaleY(d.mean, yMin, yMax);
          const h = M.top + PLOT_H - y;
          return (
            <g key={`bar-${d.agentCount}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                fill="#5f82ad"
                className="aru-bar aru-bar-stroke"
                rx={1}
                onMouseEnter={() =>
                  setHover({
                    x: cx,
                    y,
                    label: `Observed · ${d.agentCount} agent${d.agentCount > 1 ? "s" : ""}`,
                    sub: `${Math.round(d.mean).toLocaleString()} ± ${Math.round(d.std).toLocaleString()}`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
              <line
                x1={cx}
                y1={scaleY(d.mean + d.std, yMin, yMax)}
                x2={cx}
                y2={scaleY(Math.max(d.mean - d.std, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={cx - 3}
                y1={scaleY(d.mean + d.std, yMin, yMax)}
                x2={cx + 3}
                y2={scaleY(d.mean + d.std, yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={cx - 3}
                y1={scaleY(Math.max(d.mean - d.std, yMin), yMin, yMax)}
                x2={cx + 3}
                y2={scaleY(Math.max(d.mean - d.std, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
            </g>
          );
        })}

        {/* Projection band + line */}
        <path
          d={projectionBandPath}
          className="aru-projection-band"
          onMouseEnter={() =>
            setHover({
              x: M.left + PLOT_W * 0.56,
              y: scaleY(projection[1], yMin, yMax),
              label: "Linear scaling projection",
              sub: "±10% reference band",
            })
          }
          onMouseLeave={() => setHover(null)}
        />
        <path
          d={linePath}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="aru-projection-line"
          strokeDasharray="7 6"
          onMouseEnter={() =>
            setHover({
              x: M.left + PLOT_W * 0.56,
              y: scaleY(projection[1], yMin, yMax),
              label: "Linear scaling projection",
              sub: `${Math.round(projection[0]).toLocaleString()} → ${Math.round(projection[2]).toLocaleString()} MTU`,
            })
          }
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hover && <Tooltip {...hover} />}
    </div>
  );
}

/* ---------- Panel (c): Token to Success ---------- */
function PanelC() {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const data = agentResourceData.tokensToSuccess;
  const yMin = 0;
  const yMax = 20;
  const yTicks = [0, 5, 10, 15];
  const yRightMax = 5;
  const yRightTicks = [0, 1, 2, 3, 4, 5];
  const groupWidth = PLOT_W / data.length;
  const barWidth = groupWidth * 0.5;

  const linePath = data
    .map((d, i) => {
      const x = M.left + (i + 0.5) * groupWidth;
      const y = scaleY(d.successHours, 0, yRightMax);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="aru-panel">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} onMouseLeave={() => setHover(null)}>
        {/* Horizontal grid (left axis) */}
        {yTicks.map((t) => (
          <line
            key={`g-${t}`}
            x1={M.left}
            y1={scaleY(t, yMin, yMax)}
            x2={M.left + PLOT_W}
            y2={scaleY(t, yMin, yMax)}
            className="aru-grid-line"
          />
        ))}

        {/* Axes */}
        <line
          x1={M.left}
          y1={M.top + PLOT_H}
          x2={M.left + PLOT_W}
          y2={M.top + PLOT_H}
          className="aru-axis"
        />
        <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + PLOT_H} className="aru-axis" />
        {/* Right axis */}
        <line x1={M.left + PLOT_W} y1={M.top} x2={M.left + PLOT_W} y2={M.top + PLOT_H} className="aru-axis" />

        {/* X ticks */}
        {data.map((d, i) => {
          const x = M.left + (i + 0.5) * groupWidth;
          return (
            <g key={`xt-${d.agentCount}`}>
              <line x1={x} y1={M.top + PLOT_H} x2={x} y2={M.top + PLOT_H + 4} className="aru-axis" />
              <text x={x} y={M.top + PLOT_H + 16} textAnchor="middle" className="aru-tick">
                {CATEGORIES[i]}
              </text>
            </g>
          );
        })}

        {/* Left Y ticks */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line
              x1={M.left - 4}
              y1={scaleY(t, yMin, yMax)}
              x2={M.left}
              y2={scaleY(t, yMin, yMax)}
              className="aru-axis"
            />
            <text x={M.left - 8} y={scaleY(t, yMin, yMax) + 4} textAnchor="end" className="aru-tick">
              {t}
            </text>
          </g>
        ))}

        {/* Right Y ticks */}
        {yRightTicks.map((t) => (
          <g key={`yrt-${t}`}>
            <line
              x1={M.left + PLOT_W}
              y1={scaleY(t, 0, yRightMax)}
              x2={M.left + PLOT_W + 4}
              y2={scaleY(t, 0, yRightMax)}
              className="aru-axis"
            />
            <text
              x={M.left + PLOT_W + 8}
              y={scaleY(t, 0, yRightMax) + 4}
              textAnchor="start"
              className="aru-tick"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={M.left + PLOT_W / 2} y={VIEW_H - 4} textAnchor="middle" className="aru-axis-label">
          (c) Token to Success
        </text>
        <text
          x={14}
          y={M.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${M.top + PLOT_H / 2})`}
          className="aru-axis-label"
        >
          Token to Success (M)
        </text>
        <text
          x={VIEW_W - 10}
          y={M.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${VIEW_W - 10} ${M.top + PLOT_H / 2})`}
          className="aru-axis-label"
        >
          Time to success (h)
        </text>

        {/* Bars + error bars */}
        {data.map((d, i) => {
          const cx = M.left + (i + 0.5) * groupWidth;
          const x = cx - barWidth / 2;
          const y = scaleY(d.meanTokens, yMin, yMax);
          const h = M.top + PLOT_H - y;
          return (
            <g key={`bar-${d.agentCount}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                fill="#9fbe8d"
                className="aru-bar aru-bar-stroke"
                rx={1}
                onMouseEnter={() =>
                  setHover({
                    x: cx,
                    y,
                    label: `Tokens · ${d.agentCount} agent${d.agentCount > 1 ? "s" : ""}`,
                    sub: `${d.meanTokens.toFixed(2)}M ± ${d.stdTokens.toFixed(2)}M`,
                  })
                }
                onMouseLeave={() => setHover(null)}
              />
              <line
                x1={cx}
                y1={scaleY(d.meanTokens + d.stdTokens, yMin, yMax)}
                x2={cx}
                y2={scaleY(Math.max(d.meanTokens - d.stdTokens, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={cx - 3}
                y1={scaleY(d.meanTokens + d.stdTokens, yMin, yMax)}
                x2={cx + 3}
                y2={scaleY(d.meanTokens + d.stdTokens, yMin, yMax)}
                className="aru-error-bar"
              />
              <line
                x1={cx - 3}
                y1={scaleY(Math.max(d.meanTokens - d.stdTokens, yMin), yMin, yMax)}
                x2={cx + 3}
                y2={scaleY(Math.max(d.meanTokens - d.stdTokens, yMin), yMin, yMax)}
                className="aru-error-bar"
              />
            </g>
          );
        })}

        {/* Time to success overlay line */}
        <path
          d={linePath}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="aru-projection-line"
        />
        {data.map((d, i) => {
          const cx = M.left + (i + 0.5) * groupWidth;
          const cy = scaleY(d.successHours, 0, yRightMax);
          return (
            <circle
              key={`time-${d.agentCount}`}
              cx={cx}
              cy={cy}
              r={3.5}
              className="aru-overlay-circle"
              style={{ cursor: "pointer" }}
              onMouseEnter={() =>
                setHover({
                  x: cx,
                  y: cy,
                  label: `Time · ${d.agentCount} agent${d.agentCount > 1 ? "s" : ""}`,
                  sub: `${d.successHours.toFixed(1)} h`,
                })
              }
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      {hover && <Tooltip {...hover} />}
    </div>
  );
}

/* ---------- Main Figure ---------- */
export function AgentResourceUtilization({ figureNumber }: { figureNumber: number }) {
  return (
    <figure className="aru-figure">
      <ResourceLegend />
      <div className="aru-grid">
        <PanelA />
        <PanelB />
        <PanelC />
      </div>
      <figcaption className="aru-figcaption">
        Figure {figureNumber}: Agent resource utilization across 1, 4, and 8 agents. (a) Mean robot and GPU
        utilization. (b) Mean token throughput with linear scaling projection. (c) Tokens and time required to reach
        task success.
      </figcaption>
    </figure>
  );
}
