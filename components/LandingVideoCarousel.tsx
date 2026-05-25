"use client";

import { useMemo, useState } from "react";
import { parseLandingVideoUrls } from "@/lib/landingVideos";
import styles from "./LandingVideoCarousel.module.css";

type LandingVideoCarouselProps = {
  rawVideoValue: string;
};

export function LandingVideoCarousel({ rawVideoValue }: LandingVideoCarouselProps) {
  const videos = useMemo(() => parseLandingVideoUrls(rawVideoValue), [rawVideoValue]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!videos.length) {
    return (
      <div className={styles.videoPlaceholder}>
        <span className={styles.placeholderTag}>Featured</span>
        <p>Upload one or more landing videos in Admin Settings to populate this carousel.</p>
      </div>
    );
  }

  const normalizedIndex = ((activeIndex % videos.length) + videos.length) % videos.length;
  const activeVideo = videos[normalizedIndex];

  return (
    <div className={styles.carouselWrap}>
      <video
        key={activeVideo}
        src={activeVideo}
        className={styles.videoPlayer}
        controls
        muted
        loop
        playsInline
        preload="metadata"
      />

      {videos.length > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.carouselButton} ${styles.carouselButtonPrev}`}
            aria-label="Previous video"
            onClick={() => setActiveIndex((prev) => prev - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.carouselButton} ${styles.carouselButtonNext}`}
            aria-label="Next video"
            onClick={() => setActiveIndex((prev) => prev + 1)}
          >
            ›
          </button>

          <div className={styles.carouselDots}>
            {videos.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.dot} ${index === normalizedIndex ? styles.dotActive : ""}`}
                aria-label={`Show video ${index + 1}`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
