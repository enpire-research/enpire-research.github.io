"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import ExpandableVideoViewer from "@/components/ExpandableVideoViewer";
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
const progressMilestones = [0.2, 0.4, 0.6, 0.8];

const verdictLabel = (value: number | undefined, passText: string, failText: string) =>
  value === 1 ? passText : failText;

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
  const speed = playbackSpeeds[speedIndex];
  const percent = Math.round(progress * 100);

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
              <span className="ziptie-reward__decision-state">
                {verdictLabel(topPass, "Passed", "No pass")}
              </span>
            </div>
            <div className="ziptie-reward__decision" data-pass={rightPass === 1}>
              <span className="ziptie-reward__decision-cam">right camera</span>
              <span className="ziptie-reward__decision-state">
                {verdictLabel(rightPass, "Passed", "No pass")}
              </span>
            </div>
          </div>
          <figcaption className="ziptie-reward__stage-caption">
            <strong>Per-camera verdict</strong>
            <span>top and right cameras judged independently</span>
          </figcaption>
        </figure>

        <figure className="ziptie-reward__stage ziptie-reward__final-stage">
          <div className="ziptie-reward__final" data-pass={finalReward === 1} aria-label="Final reward">
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
        </div>
        <div className="pusht-reset-case__progress-shell" style={{ "--pusht-reset-progress": progress } as CSSProperties}>
          <div className="pusht-reset-case__progress-rail" aria-hidden="true">
            <span className="pusht-reset-case__progress-fill" />
            {progressMilestones.map((milestone, index) => (
              <button
                aria-label={`Timeline marker ${index + 1}`}
                className="pusht-reset-case__progress-dot"
                data-active={progress >= milestone}
                key={milestone}
                onClick={() => handleScrub(milestone)}
                style={{ left: `${milestone * 100}%` }}
                type="button"
              />
            ))}
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
        <span className="pusht-reset-case__percent ziptie-reward__readout">
          {percent}% · f{verdictIndex}
        </span>
      </div>

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
