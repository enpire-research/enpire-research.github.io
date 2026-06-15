"use client";

import { RotateCcw, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ExpandableVideoViewerProps = {
  className?: string;
  initialTime?: number;
  isOpen: boolean;
  loop?: boolean;
  onClose: () => void;
  onCycleSpeed?: () => void;
  playbackRate?: number;
  poster?: string;
  speedLabel?: string;
  src: string;
  title: string;
};

export default function ExpandableVideoViewer({
  className,
  initialTime = 0,
  isOpen,
  loop = false,
  onClose,
  onCycleSpeed,
  playbackRate = 1,
  poster,
  speedLabel,
  src,
  title,
}: ExpandableVideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    videoRef.current.playbackRate = playbackRate;
  }, [isOpen, playbackRate]);

  if (!isOpen || !mounted) {
    return null;
  }

  const replay = async () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.playbackRate = playbackRate;
    setProgress(0);
    await video.play();
  };

  const scrub = (nextProgress: number) => {
    const video = videoRef.current;
    const clamped = Math.max(0, Math.min(1, nextProgress));
    setProgress(clamped);

    if (video && duration > 0) {
      video.currentTime = clamped * duration;
    }
  };

  return createPortal(
    <div className="expandable-video-modal" onClick={onClose} role="presentation">
      <section
        aria-label={`${title} expanded video viewer`}
        aria-modal="true"
        className="expandable-video-modal__window"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="expandable-video-modal__header">
          <h4>{title}</h4>
          <button aria-label="Close expanded video viewer" onClick={onClose} type="button">
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>
        <video
          autoPlay
          className={className}
          loop={loop}
          muted
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            video.playbackRate = playbackRate;
            setDuration(video.duration || 0);
            if (initialTime > 0 && Number.isFinite(initialTime)) {
              video.currentTime = Math.min(initialTime, video.duration || initialTime);
            }
          }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setProgress(video.duration ? video.currentTime / video.duration : 0);
          }}
          playsInline
          poster={poster}
          preload="auto"
          ref={videoRef}
          src={src}
        />
        <div
          className="expandable-video-modal__controls"
          style={{ "--expandable-video-progress": progress } as CSSProperties}
        >
          <button aria-label={`Replay ${title}`} onClick={replay} type="button">
            <RotateCcw aria-hidden="true" size={15} strokeWidth={1.9} />
          </button>
          {onCycleSpeed && speedLabel ? (
            <button
              aria-label={`${title} playback speed ${speedLabel}. Click to change speed.`}
              className="expandable-video-modal__speed"
              onClick={onCycleSpeed}
              type="button"
            >
              {speedLabel}
            </button>
          ) : speedLabel ? (
            <span className="expandable-video-modal__speed" aria-label={`${title} playback speed ${speedLabel}`}>
              {speedLabel}
            </span>
          ) : null}
          <div className="expandable-video-modal__progress-shell">
            <div className="expandable-video-modal__progress-rail" aria-hidden="true">
              <span />
            </div>
            <input
              aria-label={`${title} video progress`}
              className="expandable-video-modal__progress"
              max="1"
              min="0"
              onChange={(event) => scrub(Number(event.currentTarget.value))}
              step="0.001"
              type="range"
              value={progress}
            />
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
