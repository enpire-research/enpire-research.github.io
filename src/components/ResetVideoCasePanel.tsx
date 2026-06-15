"use client";

import { Code2, Maximize2, X } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import ExpandableVideoViewer from "@/components/ExpandableVideoViewer";
import ResetSwipeCarousel from "@/components/ResetSwipeCarousel";
import { highlightPythonLine } from "@/lib/pythonHighlight";
import { useIsMobile } from "@/lib/useIsMobile";

type ResetInit = {
  id: string;
  label: string;
  poster: string;
  video: string;
};

// Optional "View Code" toggle: the reset script that drives this case.
type ResetCode = {
  file: string;
  code: string;
  title: string;
  subtitle: string;
};

const progressMilestones = [0.2, 0.4, 0.6, 0.8];
const playbackSpeeds = [2, 4, 8, 1] as const;

export function ResetVideoCasePanel({
  ariaLabel,
  initialStates,
  code,
}: {
  ariaLabel: string;
  initialStates: ResetInit[];
  code?: ResetCode;
}) {
  const [selectedId, setSelectedId] = useState(initialStates[0]?.id ?? "");
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [viewerInitialTime, setViewerInitialTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const codeLines = code ? code.code.split("\n") : [];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectedState = initialStates.find((state) => state.id === selectedId) ?? initialStates[0];
  const speed = playbackSpeeds[speedIndex];
  const percent = Math.round(progress * 100);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [selectedId, speed]);

  const resetPlaybackState = () => {
    setDuration(0);
    setIsPlaying(false);
    setProgress(0);
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

  if (!selectedState) return null;

  if (isMobile) {
    return <ResetSwipeCarousel ariaLabel={ariaLabel} initialStates={initialStates} />;
  }

  return (
    <section className="pusht-reset-case" aria-label={ariaLabel}>
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
          aria-label={`${ariaLabel} playback speed ${speed}x. Click to change speed.`}
          className="pusht-reset-case__speed"
          onClick={cycleSpeed}
          type="button"
        >
          {speed}x
        </button>
        <button
          aria-label={`Expand ${selectedState.label} reset video`}
          className="video-panel-expand-button"
          onClick={openViewer}
          type="button"
        >
          <Maximize2 aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </div>
      <div className="pusht-reset-case__controls" aria-label={`${ariaLabel} controls`}>
        <div className="pusht-reset-case__transport">
          <button className="pusht-reset-case__play" onClick={handleTogglePlayback} type="button">
            {isPlaying ? "Pause" : "Play"}
          </button>
          {code ? (
            <button
              aria-label="View the reset script code"
              aria-pressed={isCodeOpen}
              className="pusht-code-toggle ziptie-reward__code-toggle"
              data-open={isCodeOpen}
              onClick={() => setIsCodeOpen((open) => !open)}
              type="button"
            >
              <span className="ziptie-reward__code-toggle-label">View Code</span>
              <Code2 size={15} strokeWidth={1.8} />
            </button>
          ) : null}
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
        <span className="pusht-reset-case__percent">{percent}%</span>
      </div>
      <div className="pusht-reset-case__gallery" aria-label={`${ariaLabel} initial positions`}>
        {initialStates.map((state) => (
          <button
            aria-pressed={selectedId === state.id}
            className="pusht-reset-case__preset"
            data-selected={selectedId === state.id}
            key={state.id}
            onClick={() => handleSelectState(state.id)}
            type="button"
          >
            <Image alt="" height={135} src={state.poster} width={240} />
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
        title={`${ariaLabel}: ${selectedState.label}`}
      />
      {code && isCodeOpen ? (
        <div className="pusht-code-float" role="dialog" aria-label={`${code.title} source`}>
          <div className="pusht-code-window">
            <div className="pusht-code-titlebar">
              <div className="pusht-code-tab">
                <Code2 size={13} strokeWidth={1.8} />
                <span>{code.file}</span>
              </div>
              <button
                aria-label="Close reset code"
                className="pusht-icon pusht-icon--compact"
                onClick={() => setIsCodeOpen(false)}
                type="button"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
            <div className="pusht-code-meta">
              <strong>{code.title}</strong>
              <span>{code.subtitle}</span>
            </div>
            <div className="pusht-code-block">
              <code>
                {codeLines.map((line, lineIndex) => (
                  <span className="pusht-code-line" key={`reset-code-${lineIndex}`}>
                    <span className="pusht-code-line-number">{lineIndex + 1}</span>
                    <span className="pusht-code-line-text">{highlightPythonLine(line)}</span>
                  </span>
                ))}
              </code>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
