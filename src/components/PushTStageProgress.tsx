"use client";

import { useMemo, useState } from "react";
import {
  pushTStageProgress,
  type PushTStageKey,
  type PushTStageMilestone,
  type PushTStageRun,
} from "@/data/pushtStageProgress";

const VIEW_W = 740;
const VIEW_H = 380;
const M = { top: 34, right: 28, bottom: 78, left: 74 };
const PLOT_W = VIEW_W - M.left - M.right;
const PLOT_H = VIEW_H - M.top - M.bottom;
const Y_MAX = 135;
const yTicks = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135];

type HoverInfo = {
  x: number;
  y: number;
  label: string;
  sub: string;
};

function scaleY(value: number) {
  return M.top + PLOT_H - (value / Y_MAX) * PLOT_H;
}

function blendWithWhite(color: string, saturation: number) {
  const normalized = color.replace("#", "");
  const channels = [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16));
  return `#${channels
    .map((channel) => Math.round(255 - (255 - channel) * saturation).toString(16).padStart(2, "0"))
    .join("")}`;
}

function stageByKey(key: PushTStageKey) {
  return pushTStageProgress.stages.find((stage) => stage.key === key) ?? pushTStageProgress.stages[0];
}

function milestoneByKey(run: PushTStageRun, key: PushTStageKey): PushTStageMilestone {
  return run.milestones.find((milestone) => milestone.key === key) ?? run.milestones[0];
}

function Tooltip({ x, y, label, sub }: HoverInfo) {
  return (
    <div
      className="psp-tooltip"
      style={{
        left: Math.min(x + 14, VIEW_W - 188),
        top: Math.max(y - 48, 0),
      }}
    >
      <strong>{label}</strong>
      <span>{sub}</span>
    </div>
  );
}

export default function PushTStageProgress({ figureNumber }: { figureNumber: number }) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [activeStage, setActiveStage] = useState<PushTStageKey | null>(null);
  const groupWidth = PLOT_W / pushTStageProgress.runs.length;
  const barGap = 6;
  const barWidth = Math.min(34, (groupWidth - 34) / pushTStageProgress.stageOrder.length - barGap);
  const legendItems = useMemo(
    () =>
      pushTStageProgress.stageOrder.map((stageKey) => {
        const stage = stageByKey(stageKey);
        return {
          ...stage,
          color: blendWithWhite("#6b7280", stage.saturation),
        };
      }),
    [],
  );

  return (
    <figure className="psp-figure">
      <div className="psp-legend" aria-label="Push-T stage progress legend">
        {legendItems.map((item) => (
          <button
            aria-pressed={activeStage === item.key}
            className="psp-legend-item"
            data-active={activeStage === item.key ? "true" : undefined}
            key={item.key}
            onClick={() => setActiveStage((current) => (current === item.key ? null : item.key))}
            type="button"
          >
            <svg aria-hidden="true" height="10" viewBox="0 0 28 10" width="28">
              <line stroke={item.color} strokeLinecap="round" strokeWidth="4" x1="3" x2="25" y1="5" y2="5" />
            </svg>
            {item.label}
          </button>
        ))}
      </div>

      <div className="psp-chart-shell">
        <svg
          className="psp-svg"
          onMouseLeave={() => setHover(null)}
          role="img"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        >
          <title>Push-T stage-wise research progress</title>
          <desc>
            Grouped bar chart showing minutes to first move, range satisfaction, orientation satisfaction, and first
            success for Codex vision ablations.
          </desc>

          {yTicks.map((tick) => (
            <g key={tick}>
              <line className="psp-grid-line" x1={M.left} x2={M.left + PLOT_W} y1={scaleY(tick)} y2={scaleY(tick)} />
              <text className="psp-tick" textAnchor="end" x={M.left - 10} y={scaleY(tick) + 4}>
                {tick}
              </text>
            </g>
          ))}

          <line className="psp-axis" x1={M.left} x2={M.left + PLOT_W} y1={M.top + PLOT_H} y2={M.top + PLOT_H} />
          <line className="psp-axis" x1={M.left} x2={M.left} y1={M.top} y2={M.top + PLOT_H} />
          <text className="psp-axis-label" textAnchor="start" x={M.left} y={M.top - 12}>
            Time-to- (min)
          </text>

          {pushTStageProgress.runs.map((run, runIndex) => {
            const groupCenter = M.left + groupWidth * (runIndex + 0.5);
            const groupStart =
              groupCenter -
              (pushTStageProgress.stageOrder.length * barWidth +
                (pushTStageProgress.stageOrder.length - 1) * barGap) /
                2;

            return (
              <g key={run.key}>
                {pushTStageProgress.stageOrder.map((stageKey, stageIndex) => {
                  const stage = stageByKey(stageKey);
                  const milestone = milestoneByKey(run, stageKey);
                  const x = groupStart + stageIndex * (barWidth + barGap);
                  const y = scaleY(milestone.elapsedMinutes);
                  const height = M.top + PLOT_H - y;
                  const color = blendWithWhite(run.color, stage.saturation);
                  const isFirstSuccess = stageKey === "first_success";
                  const errTop = scaleY(Math.min(Y_MAX, milestone.elapsedMinutes + run.firstSuccessStdMinutes));
                  const errBottom = scaleY(Math.max(0, milestone.elapsedMinutes - run.firstSuccessStdMinutes));

                  return (
                    <g key={`${run.key}-${stageKey}`}>
                      <rect
                        className="psp-bar"
                        data-muted={activeStage !== null && activeStage !== stageKey ? "true" : undefined}
                        fill={color}
                        height={height}
                        rx={2}
                        width={barWidth}
                        x={x}
                        y={y}
                        onMouseEnter={() =>
                          setHover({
                            x: x + barWidth / 2,
                            y,
                            label: `${run.label}${run.sublabel ? ` ${run.sublabel}` : ""}`,
                            sub: `${stage.label}: ${milestone.elapsedLabel} (${milestone.elapsedMinutes.toFixed(1)} min)`,
                          })
                        }
                      />
                      {isFirstSuccess ? (
                        <g className="psp-error-bar">
                          <line x1={x + barWidth / 2} x2={x + barWidth / 2} y1={errTop} y2={errBottom} />
                          <line x1={x + barWidth / 2 - 7} x2={x + barWidth / 2 + 7} y1={errTop} y2={errTop} />
                          <line x1={x + barWidth / 2 - 7} x2={x + barWidth / 2 + 7} y1={errBottom} y2={errBottom} />
                        </g>
                      ) : null}
                      <text className="psp-value" textAnchor="middle" x={x + barWidth / 2} y={Math.max(y - 7, 14)}>
                        {Math.round(milestone.elapsedMinutes)}
                      </text>
                    </g>
                  );
                })}
                <text className="psp-run-label" textAnchor="middle" x={groupCenter} y={M.top + PLOT_H + 26}>
                  {run.label}
                </text>
                {run.sublabel ? (
                  <text className="psp-run-sublabel" textAnchor="middle" x={groupCenter} y={M.top + PLOT_H + 45}>
                    {run.sublabel}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {hover ? <Tooltip {...hover} /> : null}
      </div>

      <figcaption className="psp-caption">
        Figure {figureNumber}: Push-T stage-wise progress under the fleet scaling setup. Bars report time to successive
        behavioral milestones; whiskers mark first-success variability.
      </figcaption>
    </figure>
  );
}
