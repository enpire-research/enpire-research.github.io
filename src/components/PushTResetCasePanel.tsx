"use client";

import { Maximize2 } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import ExpandableVideoViewer from "@/components/ExpandableVideoViewer";

const initialStates = [
  {
    id: "init-1",
    label: "Random Init 1",
    poster: "/images/pusht-reset-only-1-frame.jpg",
    video: "/videos/pusht-reset-only-1.mp4",
  },
  {
    id: "init-2",
    label: "Random Init 2",
    poster: "/images/pusht-reset-only-2-frame.jpg",
    video: "/videos/pusht-reset-only-2.mp4",
  },
  {
    id: "init-3",
    label: "Random Init 3",
    poster: "/images/pusht-reset-only-3-frame.jpg",
    video: "/videos/pusht-reset-only-3.mp4",
  },
  {
    id: "init-4",
    label: "Random Init 4",
    poster: "/images/pusht-reset-only-4-frame.jpg",
    video: "/videos/pusht-reset-only-4.mp4",
  },
];
const progressMilestones = [0.2, 0.4, 0.6, 0.8];
const playbackSpeeds = [2, 4, 8, 1] as const;
type ResetKeypoint = {
  id: string;
  image: string;
  label: string;
  progress: number;
  time: number;
};

export default function PushTResetCasePanel() {
  const [selectedId, setSelectedId] = useState(initialStates[0].id);
  const [keypoints, setKeypoints] = useState<ResetKeypoint[]>([]);
  const [selectedKeypointId, setSelectedKeypointId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [viewerInitialTime, setViewerInitialTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedState = initialStates.find((state) => state.id === selectedId) ?? initialStates[0];
  const speed = playbackSpeeds[speedIndex];
  const resetKeypoints = selectedState.id === "init-1" ? keypoints : [];
  const activeKeypoint =
    resetKeypoints.find((point) => point.id === selectedKeypointId) ??
    resetKeypoints.reduce<ResetKeypoint | null>((nearest, point) => {
      if (!nearest) return point;
      return Math.abs(point.progress - progress) < Math.abs(nearest.progress - progress) ? point : nearest;
    }, null);
  const percent = Math.round(progress * 100);

  useEffect(() => {
    let cancelled = false;

    fetch("/data/pusht-reset-1-keypoints.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.keypoints) return;
        setKeypoints(
          data.keypoints
            .map((point: Partial<ResetKeypoint>, index: number) => ({
              id: String(point.id || `kp-${index + 1}`),
              image: String(point.image || ""),
              label: String(point.label || `Keypoint ${index + 1}`),
              progress: Number(point.progress || 0),
              time: Number(point.time || 0),
            }))
            .filter((point: ResetKeypoint) => point.progress >= 0 && point.progress <= 1)
            .sort((a: ResetKeypoint, b: ResetKeypoint) => a.progress - b.progress),
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [selectedId, speed]);

  const resetPlaybackState = () => {
    setDuration(0);
    setIsPlaying(false);
    setProgress(0);
    setSelectedKeypointId(null);
  };

  const handleSelectState = (id: string) => {
    if (id === selectedId) return;
    resetPlaybackState();
    setSelectedId(id);
  };

  const handleTogglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const cycleSpeed = () => {
    setSpeedIndex((current) => (current + 1) % playbackSpeeds.length);
  };

  const handleScrub = (nextProgress: number) => {
    const video = videoRef.current;
    const clamped = Math.max(0, Math.min(1, nextProgress));
    setProgress(clamped);

    if (video && duration > 0) {
      video.currentTime = clamped * duration;
    }
  };

  const openViewer = () => {
    setViewerInitialTime(videoRef.current?.currentTime ?? 0);
    setIsViewerOpen(true);
  };

  return (
    <section className="pusht-reset-case" aria-label="Case 1 Push T auto reset">
      <div className="pusht-reset-case__video">
        <video
          key={selectedState.id}
          muted
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(event) => {
            event.currentTarget.playbackRate = speed;
            setDuration(event.currentTarget.duration || 0);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setProgress(video.duration ? video.currentTime / video.duration : 0);
          }}
          playsInline
          poster={selectedState.poster}
          preload="metadata"
          ref={videoRef}
          src={selectedState.video}
        />
        <button
          aria-label={`Push T reset playback speed ${speed}x. Click to change speed.`}
          className="pusht-reset-case__speed"
          onClick={cycleSpeed}
          type="button"
        >
          {speed}x
        </button>
        <button
          aria-label={`Expand ${selectedState.label} Push T reset video`}
          className="video-panel-expand-button"
          onClick={openViewer}
          type="button"
        >
          <Maximize2 aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </div>
      <div className="pusht-reset-case__controls" aria-label="Push T reset video controls">
        <button className="pusht-reset-case__play" onClick={handleTogglePlayback} type="button">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="pusht-reset-case__progress-shell" style={{ "--pusht-reset-progress": progress } as CSSProperties}>
          <div className="pusht-reset-case__progress-rail" aria-hidden="true">
            <span className="pusht-reset-case__progress-fill" />
            {(resetKeypoints.length > 0 ? resetKeypoints : progressMilestones).map((milestone, index) => {
              const keypoint = typeof milestone === "number" ? null : milestone;
              const milestoneProgress = typeof milestone === "number" ? milestone : milestone.progress;

              return (
                <button
                  aria-label={keypoint ? `Jump to ${keypoint.label}` : `Timeline marker ${index + 1}`}
                  className="pusht-reset-case__progress-dot"
                  data-active={progress >= milestoneProgress}
                  data-selected={keypoint?.id === selectedKeypointId}
                  key={keypoint?.id ?? milestoneProgress}
                  onClick={() => {
                    if (keypoint) {
                      setSelectedKeypointId(keypoint.id);
                    }
                    handleScrub(milestoneProgress);
                  }}
                  style={{ left: `${milestoneProgress * 100}%` }}
                  title={keypoint ? `${keypoint.label} · ${keypoint.time.toFixed(2)}s` : undefined}
                  type="button"
                />
              );
            })}
          </div>
          <input
            aria-label="Push T reset progress"
            className="pusht-reset-case__progress"
            max="1"
            min="0"
            onChange={(event) => handleScrub(Number(event.currentTarget.value))}
            step="0.001"
            type="range"
            value={progress}
          />
        </div>
        <span className="pusht-reset-case__percent">{percent}%</span>
      </div>
      {resetKeypoints.length > 0 ? (
        <div className="pusht-reset-case__keypoints" aria-label="Saved keypoint image relationships">
          {resetKeypoints.map((point) => (
            <button
              className="pusht-reset-case__keypoint"
              data-selected={activeKeypoint?.id === point.id}
              key={point.id}
              onClick={() => {
                setSelectedKeypointId(point.id);
                handleScrub(point.progress);
              }}
              type="button"
            >
              {point.image ? <img alt="" src={`/images/pusht-reset-1-images/${point.image}`} /> : null}
              <span>{point.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="pusht-reset-case__gallery" aria-label="Push T initial positions">
        {initialStates.map((state) => (
          <button
            aria-pressed={selectedId === state.id}
            className="pusht-reset-case__preset"
            data-selected={selectedId === state.id}
            key={state.id}
            onClick={() => handleSelectState(state.id)}
            type="button"
          >
            <Image
              alt=""
              height={135}
              src={state.poster}
              width={240}
            />
            <span>{state.label}</span>
          </button>
        ))}
      </div>
      <ExpandableVideoViewer
        initialTime={viewerInitialTime}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onCycleSpeed={cycleSpeed}
        playbackRate={speed}
        poster={selectedState.poster}
        speedLabel={`${speed}x`}
        src={selectedState.video}
        title={`Push T reset: ${selectedState.label}`}
      />
    </section>
  );
}
