"use client";

import { Code2, Pause, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { highlightPythonLine } from "@/lib/pythonHighlight";
import {
  pushTAgents,
  pushTGoal,
  pushTPresets,
  type Point,
  type PushTAgentId,
  type PushTKeyframe,
  type PushTPresetGroup,
  type PushTPreset,
  type PushTRollout,
} from "@/data/pushtPolicy";
import { pushTPolicyCode, pushTPolicyCodeFiles } from "@/data/pushtPolicyCode";

const localTPolygons = [
  [
    [-60, 30],
    [60, 30],
    [60, 0],
    [-60, 0],
  ],
  [
    [-15, 30],
    [-15, 120],
    [15, 120],
    [15, 30],
  ],
] as const;

const durationMs = 3800;
const agentRadius = 16;
const pushTModelNames: Record<PushTAgentId, string> = {
  codex: "GPT-5",
  claude: "Claude Sonnet 4",
  kimi: "Kimi K2",
};
const pushTPresetGroups: { id: PushTPresetGroup; label: string }[] = [
  { id: "in_distribution", label: "In-distribution random init" },
  { id: "ood", label: "OOD random init" },
];
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function angleLerp(a: number, b: number, t: number) {
  const delta = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  return a + delta * t;
}

function interpolateFrames(frames: PushTKeyframe[], progress: number): PushTKeyframe {
  const clamped = Math.max(0, Math.min(1, progress));
  const nextIndex = frames.findIndex((frame) => frame.t >= clamped);

  if (nextIndex <= 0) {
    return frames[0];
  }

  const next = frames[nextIndex];
  const previous = frames[nextIndex - 1];
  const span = next.t - previous.t || 1;
  const local = (clamped - previous.t) / span;

  return {
    t: clamped,
    agent: [lerp(previous.agent[0], next.agent[0], local), lerp(previous.agent[1], next.agent[1], local)],
    block: [lerp(previous.block[0], next.block[0], local), lerp(previous.block[1], next.block[1], local)],
    angle: angleLerp(previous.angle, next.angle, local),
    coverage: lerp(previous.coverage, next.coverage, local),
    action:
      previous.action && next.action
        ? [lerp(previous.action[0], next.action[0], local), lerp(previous.action[1], next.action[1], local)]
        : previous.action ?? next.action,
  };
}

function toPath(points: readonly (readonly number[])[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ") + " Z";
}

function TShape({
  angle,
  className,
  fill,
  position,
  stroke,
}: {
  angle: number;
  className: string;
  fill?: string;
  position: Point;
  stroke?: string;
}) {
  return (
    <g className={className} transform={`translate(${position[0]} ${position[1]}) rotate(${(angle * 180) / Math.PI})`}>
      {localTPolygons.map((polygon, index) => (
        <path d={toPath(polygon)} fill={fill} key={index} stroke={stroke} strokeWidth="3" vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
}

function MiniScene({ preset }: { preset: PushTPreset }) {
  const first = preset.rollouts.codex.frames[0];

  return (
    <svg aria-hidden="true" className="pusht-preset__scene" viewBox="0 0 512 512">
      <TShape angle={pushTGoal.angle} className="pusht-goal" position={pushTGoal.position} />
      <TShape angle={first.angle} className="pusht-block" position={first.block} />
      <circle className="pusht-agent" cx={first.agent[0]} cy={first.agent[1]} r="18" />
    </svg>
  );
}

function activePath(points: Point[], progress: number, currentAgent: Point) {
  const count = Math.max(1, Math.ceil(progress * points.length));
  return [...points.slice(0, count), currentAgent]
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");
}

function rolloutDisplayColor(rollout: PushTRollout) {
  return rollout.agentId === "kimi" ? "var(--pusht-kimi-color)" : rollout.color;
}

function rolloutStrokeColor(rollout: PushTRollout) {
  return rollout.agentId === "kimi" ? undefined : rollout.color;
}

function rolloutActionColor(rollout: PushTRollout) {
  return rolloutStrokeColor(rollout);
}

function RolloutCard({
  isCodeOpen,
  onToggleCode,
  progress,
  rollout,
}: {
  isCodeOpen: boolean;
  onToggleCode: () => void;
  progress: number;
  rollout: PushTRollout;
}) {
  const current = useMemo(() => interpolateFrames(rollout.frames, progress), [progress, rollout.frames]);
  const currentAction = current.action ?? current.agent;
  const agentPath = useMemo(() => rollout.frames.map((frame) => frame.agent), [rollout.frames]);
  const displayColor = rolloutDisplayColor(rollout);
  const strokeColor = rolloutStrokeColor(rollout);
  const actionColor = rolloutActionColor(rollout);

  return (
    <div className="pusht-viewport" data-agent={rollout.agentId} aria-label={`Push-T rollout for ${rollout.label}`}>
      <div className="pusht-card-head">
        <div className="pusht-viewport-label" style={{ color: displayColor }}>
          {rollout.label}
          <button
            aria-label={`${rollout.label} code`}
            aria-pressed={isCodeOpen}
            className="pusht-code-toggle"
            data-open={isCodeOpen}
            onClick={onToggleCode}
            type="button"
          >
            <Code2 size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <svg className="pusht-canvas" viewBox="0 0 512 512" role="img">
        <title>{`${rollout.label} Push-T rollout`}</title>
        <rect fill="transparent" height="512" width="512" />
        <path className="pusht-grid" d="M 128 16 V 496 M 256 16 V 496 M 384 16 V 496 M 16 128 H 496 M 16 256 H 496 M 16 384 H 496" fill="none" strokeWidth="1" />
        <TShape angle={pushTGoal.angle} className="pusht-goal" position={pushTGoal.position} />
        <path className="pusht-trace" d={agentPath.map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`).join(" ")} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path
          className="pusht-trace pusht-trace--active"
          d={activePath(agentPath, progress, current.agent)}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          style={strokeColor ? { stroke: strokeColor } : undefined}
        />
        <TShape angle={current.angle} className="pusht-block" position={current.block} />
        <line className="pusht-action" x1={current.agent[0]} y1={current.agent[1]} x2={currentAction[0]} y2={currentAction[1]} stroke={actionColor} strokeDasharray="6 8" strokeWidth="2" style={actionColor ? { stroke: actionColor } : undefined} />
        <circle className="pusht-agent-halo" cx={current.agent[0]} cy={current.agent[1]} r="27" />
        <circle className="pusht-agent" cx={current.agent[0]} cy={current.agent[1]} r={agentRadius} stroke={strokeColor} strokeWidth="3" style={strokeColor ? { stroke: strokeColor } : undefined} />
        <path className="pusht-action-marker" d={`M ${currentAction[0] - 8} ${currentAction[1]} H ${currentAction[0] + 8} M ${currentAction[0]} ${currentAction[1] - 8} V ${currentAction[1] + 8}`} fill="none" stroke={actionColor} strokeLinecap="round" strokeWidth="4" style={actionColor ? { stroke: actionColor } : undefined} />
      </svg>
      <div className="pusht-card-readouts">
        <span>{Math.round(current.coverage * 100)}% coverage</span>
        <span>{rollout.steps} steps</span>
      </div>
    </div>
  );
}

export default function PushTPolicyPanel() {
  const [selectedId, setSelectedId] = useState(pushTPresets[0].id);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCodeAgent, setActiveCodeAgent] = useState<PushTAgentId | null>(null);
  const startRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  const selected = useMemo(
    () => pushTPresets.find((preset) => preset.id === selectedId) ?? pushTPresets[0],
    [selectedId],
  );
  const activeCodeRollout = activeCodeAgent ? selected.rollouts[activeCodeAgent] : null;
  const activeCode = activeCodeAgent ? pushTPolicyCode[activeCodeAgent] : "";
  const activeCodeLines = useMemo(() => activeCode.split("\n"), [activeCode]);
  const groupedPresets = useMemo(
    () =>
      pushTPresetGroups.map((group) => ({
        ...group,
        presets: pushTPresets.filter((preset) => preset.group === group.id),
      })),
    [],
  );

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!isRunning) {
      startRef.current = null;
      return;
    }

    let frameId = 0;

    const tick = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp - progressRef.current * durationMs;
      }

      const nextProgress = Math.min(1, (timestamp - startRef.current) / durationMs);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        setIsRunning(false);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isRunning]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsRunning(false);
    setProgress(0);
  };

  const handleRun = () => {
    if (progress >= 1) {
      setProgress(0);
      progressRef.current = 0;
    }
    setIsRunning((running) => !running);
  };

  const handleReset = () => {
    setIsRunning(false);
    setProgress(0);
  };

  return (
    <section className="pusht-panel">
      <div className="pusht-actions pusht-actions--top">
        <button className="pusht-run" onClick={handleRun} type="button">
          {isRunning ? <Pause size={16} strokeWidth={1.8} /> : <Play size={16} strokeWidth={1.8} />}
          {" "}
          {isRunning ? "Pause" : "Run"}
        </button>
        <button className="pusht-icon" aria-label="Reset rollout" onClick={handleReset} type="button">
          <RotateCcw size={16} strokeWidth={1.8} />
        </button>
      </div>

      <div className="pusht-workbench" data-code-open={activeCodeAgent ? "true" : "false"}>
        <div className="pusht-workbench__main">
          <div className="pusht-stage">
            {pushTAgents.map((agentId) => (
              <RolloutCard
                isCodeOpen={activeCodeAgent === agentId}
                key={agentId}
                onToggleCode={() => setActiveCodeAgent((current) => (current === agentId ? null : agentId))}
                progress={progress}
                rollout={selected.rollouts[agentId]}
              />
            ))}
          </div>
        </div>

        {activeCodeAgent && activeCodeRollout ? (
          <div className="pusht-code-float" role="dialog" aria-label={`${activeCodeRollout.label} policy source`}>
            <div className="pusht-code-window">
              <div className="pusht-code-titlebar">
                <div className="pusht-code-tab">
                  <Code2 size={13} strokeWidth={1.8} />
                  <span>{pushTPolicyCodeFiles[activeCodeAgent]}</span>
                </div>
                <button className="pusht-icon pusht-icon--compact" aria-label="Close policy code" onClick={() => setActiveCodeAgent(null)} type="button">
                  <X size={15} strokeWidth={1.8} />
                </button>
              </div>
              <div className="pusht-code-meta">
                <strong>{activeCodeRollout.policy}</strong>
                <span>{activeCodeRollout.label}</span>
                <span>{pushTModelNames[activeCodeAgent]}</span>
              </div>
              <div className="pusht-code-block">
                <code>
                  {activeCodeLines.map((line, index) => (
                    <span className="pusht-code-line" key={`${activeCodeAgent}-${index}`}>
                      <span className="pusht-code-line-number">{index + 1}</span>
                      <span className="pusht-code-line-text">{highlightPythonLine(line)}</span>
                    </span>
                  ))}
                </code>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="pusht-gallery" aria-label="Initial state gallery">
        {groupedPresets.map((group) => (
          <div className="pusht-gallery-row" key={group.id}>
            <div className="pusht-gallery-title">{group.label}</div>
            <div className="pusht-gallery-items">
              {group.presets.map((preset) => (
                <button
                  className="pusht-preset"
                  data-selected={preset.id === selected.id}
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  type="button"
                >
                  <MiniScene preset={preset} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
