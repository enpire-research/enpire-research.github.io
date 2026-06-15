"use client";

import { ChevronLeft, ChevronRight, Code2, Maximize2, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import ExpandableVideoViewer from "@/components/ExpandableVideoViewer";
import { highlightPythonLine } from "@/lib/pythonHighlight";
import { ziptieRewardCode, ziptieRewardCodeFile } from "@/data/ziptieRewardCode";
import {
  ziptieFinalReward,
  ziptieRewardFrameCount,
  ziptieRewardFrameRate,
  ziptieRightVerdicts,
  ziptieTopVerdicts,
} from "@/data/ziptieReward";

type RewardStage = {
  id: string;
  label: string;
  sub: string;
  src: string;
};

// Each clip stacks the top camera over the right camera (vertical, neck-and-neck).
const stages: RewardStage[] = [
  {
    id: "bbox",
    label: "Bounding boxes",
    sub: "detector boxes drawn on the raw top and right views",
    src: "/videos/ziptie-reward-bbox.mp4",
  },
  {
    id: "segmentation",
    label: "Segmentation",
    sub: "part masks overlaid on the raw top and right views",
    src: "/videos/ziptie-reward-seg.mp4",
  },
];

const FRAME_RATE = ziptieRewardFrameRate;
const FRAME_COUNT = ziptieRewardFrameCount;
const playbackSpeeds = [1, 2, 4, 0.5] as const;
const ziptieRewardCodeLines = ziptieRewardCode.split("\n");

const verdictLabel = (value: number | undefined, passText: string, failText: string) =>
  value === 1 ? passText : failText;

// Mimics the physical check: the strap must slide through the ratchet head and
// reach past the dashed length threshold for the camera to vote Yes.
function ZiptieDecisionGlyph() {
  return (
    <svg className="ziptie-reward__decision-glyph" viewBox="0 0 120 56" aria-hidden="true">
      <line className="ziptie-reward__glyph-threshold" x1="100" x2="100" y1="10" y2="46" />
      <rect className="ziptie-reward__glyph-strap" height="10" rx="3" width="42" x="4" y="23" />
      <rect className="ziptie-reward__glyph-head" height="30" rx="4" width="22" x="52" y="13" />
    </svg>
  );
}

export function ZiptieRewardPanel() {
  const ariaLabel = "Case 3 Tie Zip-tie reward verification";
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [frame, setFrame] = useState(0);
  const [viewerStageIndex, setViewerStageIndex] = useState<number | null>(null);
  const [viewerInitialTime, setViewerInitialTime] = useState(0);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const speed = playbackSpeeds[speedIndex];

  // Clamp the verdict index to the kept-frame range.
  const verdictIndex = Math.min(Math.max(frame, 0), FRAME_COUNT - 1);
  const topPass = ziptieTopVerdicts[verdictIndex];
  const rightPass = ziptieRightVerdicts[verdictIndex];
  const finalReward = ziptieFinalReward[verdictIndex];

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.playbackRate = speed;
      }
    });
  }, [speed]);

  const getLeadVideo = () => videoRefs.current.find((video) => video) ?? null;

  const syncFollowers = (time: number) => {
    videoRefs.current.forEach((video) => {
      if (!video) return;
      const target = Math.min(time, Number.isFinite(video.duration) ? video.duration : time);
      if (Math.abs(video.currentTime - target) > 0.06) {
        video.currentTime = target;
      }
    });
  };

  const updateFromTime = (time: number) => {
    if (duration > 0) {
      setProgress(time / duration);
    }
    setFrame(Math.round(time * FRAME_RATE));
  };

  const togglePlayback = async () => {
    const lead = getLeadVideo();
    if (!lead) return;

    if (lead.paused) {
      await Promise.all(
        videoRefs.current.map((video) => (video ? video.play().catch(() => undefined) : undefined)),
      );
      setIsPlaying(true);
    } else {
      videoRefs.current.forEach((video) => video?.pause());
      setIsPlaying(false);
    }
  };

  const cycleSpeed = () => {
    setSpeedIndex((current) => (current + 1) % playbackSpeeds.length);
  };

  const seekToTime = (time: number) => {
    const clampedTime = Math.max(0, duration > 0 ? Math.min(time, duration) : time);
    syncFollowers(clampedTime);
    updateFromTime(clampedTime);
  };

  const handleScrub = (nextProgress: number) => {
    const clamped = Math.max(0, Math.min(1, nextProgress));
    setProgress(clamped);
    if (duration > 0) {
      const time = clamped * duration;
      syncFollowers(time);
      setFrame(Math.round(time * FRAME_RATE));
    }
  };

  const stepFrame = (delta: number) => {
    videoRefs.current.forEach((video) => video?.pause());
    setIsPlaying(false);
    const lead = getLeadVideo();
    if (!lead) return;
    seekToTime(lead.currentTime + delta / FRAME_RATE);
  };

  const openViewer = (index: number) => {
    setViewerInitialTime(getLeadVideo()?.currentTime ?? 0);
    setViewerStageIndex(index);
  };

  return (
    <section className="ziptie-reward" aria-label={ariaLabel}>
      <div className="ziptie-reward__stages">
        <div className="ziptie-reward__row-labels" aria-hidden="true">
          <span>top cam</span>
          <span>wrist cam</span>
        </div>
        {stages.map((stage, index) => (
          <figure className="ziptie-reward__stage" key={stage.id}>
            <div className="ziptie-reward__stage-frame">
              <video
                aria-label={`${stage.label}: ${stage.sub}`}
                loop
                muted
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(event) => {
                  event.currentTarget.playbackRate = speed;
                  if (index === 0) {
                    setDuration(event.currentTarget.duration || 0);
                  }
                }}
                onPause={() => {
                  if (index === 0) setIsPlaying(false);
                }}
                onPlay={() => {
                  if (index === 0) setIsPlaying(true);
                }}
                onTimeUpdate={(event) => {
                  if (index !== 0) return;
                  updateFromTime(event.currentTarget.currentTime);
                }}
                playsInline
                preload="metadata"
                ref={(element) => {
                  videoRefs.current[index] = element;
                  // Cached videos can have metadata ready before React attaches
                  // onLoadedMetadata, so read the duration directly when present.
                  if (index === 0 && element && element.readyState >= 1 && element.duration) {
                    setDuration(element.duration);
                  }
                }}
                src={stage.src}
              />
              <button
                aria-label={`Expand ${stage.label} video`}
                className="video-panel-expand-button"
                onClick={() => openViewer(index)}
                type="button"
              >
                <Maximize2 aria-hidden="true" size={16} strokeWidth={1.8} />
              </button>
            </div>
            <figcaption className="ziptie-reward__stage-caption">
              <strong>{stage.label}</strong>
              <span>{stage.sub}</span>
            </figcaption>
          </figure>
        ))}

        <figure className="ziptie-reward__stage ziptie-reward__decisions-stage">
          <div className="ziptie-reward__decisions" aria-label="Per-camera verification verdict">
            <div className="ziptie-reward__decision" data-pass={topPass === 1}>
              <span className="ziptie-reward__decision-cam">top camera</span>
              <ZiptieDecisionGlyph />
              <span className="ziptie-reward__decision-state">
                {verdictLabel(topPass, "Yes", "No")}
              </span>
            </div>
            <div className="ziptie-reward__decision" data-pass={rightPass === 1}>
              <span className="ziptie-reward__decision-cam">right camera</span>
              <ZiptieDecisionGlyph />
              <span className="ziptie-reward__decision-state">
                {verdictLabel(rightPass, "Yes", "No")}
              </span>
            </div>
          </div>
          <figcaption className="ziptie-reward__stage-caption">
            <strong>Per-camera verdict</strong>
            <span>Is tail covered by head?</span>
          </figcaption>
        </figure>

        <figure className="ziptie-reward__stage ziptie-reward__final-stage">
          <div className="ziptie-reward__final" data-pass={finalReward === 1} aria-label="Final reward">
            {/* Two lines enter at the per-camera row centers (25% / 75%), merge
                into an AND badge, and point at the fused reward. */}
            <svg className="ziptie-reward__final-connector" viewBox="0 0 56 204" aria-hidden="true">
              <path className="ziptie-reward__connector-line" d="M0 51 C 14 51, 10 98, 20 99" />
              <path className="ziptie-reward__connector-line" d="M0 153 C 14 153, 10 106, 20 105" />
              <rect className="ziptie-reward__connector-badge" height="20" rx="10" width="28" x="20" y="92" />
              <text className="ziptie-reward__connector-text" dominantBaseline="central" textAnchor="middle" x="34" y="102.5">
                AND
              </text>
              <path className="ziptie-reward__connector-arrow" d="M50 97 L56 102 L50 107 Z" />
            </svg>
            <span className="ziptie-reward__final-value">REWARD={finalReward === 1 ? 1 : 0}</span>
          </div>
          <figcaption className="ziptie-reward__stage-caption">
            <strong>Final reward</strong>
            <span>both cameras fused into one binary reward</span>
          </figcaption>
        </figure>
      </div>

      <div className="pusht-reset-case__controls ziptie-reward__controls" aria-label={`${ariaLabel} controls`}>
        <div className="ziptie-reward__transport">
          <button
            aria-label="Step back one frame"
            className="ziptie-reward__step"
            onClick={() => stepFrame(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={15} strokeWidth={1.9} />
          </button>
          <button className="pusht-reset-case__play" onClick={togglePlayback} type="button">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            aria-label="Step forward one frame"
            className="ziptie-reward__step"
            onClick={() => stepFrame(1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={15} strokeWidth={1.9} />
          </button>
          <button
            aria-label={`Playback speed ${speed}x. Click to change speed.`}
            className="pusht-reset-case__speed ziptie-reward__speed"
            onClick={cycleSpeed}
            type="button"
          >
            {speed}x
          </button>
          <button
            aria-label="View the reward function code"
            aria-pressed={isCodeOpen}
            className="pusht-code-toggle ziptie-reward__code-toggle"
            data-open={isCodeOpen}
            onClick={() => setIsCodeOpen((open) => !open)}
            type="button"
          >
            <Code2 size={15} strokeWidth={1.8} />
          </button>
        </div>
        <div className="pusht-reset-case__progress-shell" style={{ "--pusht-reset-progress": progress } as CSSProperties}>
          <div className="pusht-reset-case__progress-rail" aria-hidden="true">
            <span className="pusht-reset-case__progress-fill" />
          </div>
          <input
            aria-label={`${ariaLabel} progress`}
            className="pusht-reset-case__progress"
            max="1"
            min="0"
            onChange={(event) => handleScrub(Number(event.currentTarget.value))}
            step="0.001"
            type="range"
            value={progress}
          />
        </div>
      </div>

      {isCodeOpen ? (
        <div className="pusht-code-float" role="dialog" aria-label="Zip-tie reward function source">
          <div className="pusht-code-window">
            <div className="pusht-code-titlebar">
              <div className="pusht-code-tab">
                <Code2 size={13} strokeWidth={1.8} />
                <span>{ziptieRewardCodeFile}</span>
              </div>
              <button
                aria-label="Close reward code"
                className="pusht-icon pusht-icon--compact"
                onClick={() => setIsCodeOpen(false)}
                type="button"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
            <div className="pusht-code-meta">
              <strong>Autoresearch-derived reward</strong>
              <span>Case 3: Tie Zip-tie</span>
              <span>SAM3 + mask geometry</span>
            </div>
            <div className="pusht-code-block">
              <code>
                {ziptieRewardCodeLines.map((line, index) => (
                  <span className="pusht-code-line" key={`reward-code-${index}`}>
                    <span className="pusht-code-line-number">{index + 1}</span>
                    <span className="pusht-code-line-text">{highlightPythonLine(line)}</span>
                  </span>
                ))}
              </code>
            </div>
          </div>
        </div>
      ) : null}

      {viewerStageIndex !== null ? (
        <ExpandableVideoViewer
          initialTime={viewerInitialTime}
          isOpen={viewerStageIndex !== null}
          loop
          onClose={() => setViewerStageIndex(null)}
          onCycleSpeed={cycleSpeed}
          playbackRate={speed}
          speedLabel={`${speed}x`}
          src={stages[viewerStageIndex].src}
          title={`${ariaLabel}: ${stages[viewerStageIndex].label}`}
        />
      ) : null}
    </section>
  );
}

export default ZiptieRewardPanel;
