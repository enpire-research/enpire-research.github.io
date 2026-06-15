"use client";

import { useEffect, useRef, useState } from "react";

type ResetInit = {
  id: string;
  label: string;
  poster: string;
  video: string;
};

// Mobile reset UI: a horizontal swipe carousel of the init videos. Swiping a
// card to the center plays it (and pauses the others); no thumbnail gallery.
export function ResetSwipeCarousel({
  ariaLabel,
  initialStates,
}: {
  ariaLabel: string;
  initialStates: ResetInit[];
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Play whichever card is most visible; pause the rest.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          const index = videoRefs.current.indexOf(video);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(index);
            void video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        }
      },
      { root: track, threshold: [0, 0.6, 1] },
    );

    videoRefs.current.forEach((video) => video && observer.observe(video));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="reset-carousel" aria-label={`${ariaLabel} initial states`}>
      <div className="reset-carousel__track" ref={trackRef}>
        {initialStates.map((state, index) => (
          <figure className="reset-carousel__card" key={state.id}>
            <video
              aria-label={`${ariaLabel}: ${state.label}`}
              loop
              muted
              playsInline
              poster={state.poster}
              preload="metadata"
              ref={(element) => {
                videoRefs.current[index] = element;
              }}
              src={state.video}
            />
            <figcaption className="reset-carousel__label">{state.label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="reset-carousel__dots" aria-hidden="true">
        {initialStates.map((state, index) => (
          <span className="reset-carousel__dot" data-active={index === activeIndex} key={state.id} />
        ))}
      </div>
    </div>
  );
}

export default ResetSwipeCarousel;
