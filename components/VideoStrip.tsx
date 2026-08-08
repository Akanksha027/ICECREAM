"use client";

const VIDEOS = [
  {
    id: 1,
    poster: "/img20.jpeg",
    src: "/video2.mp4", // Replace with actual video URL
  },
  {
    id: 2,
    poster: "/img21.jpeg",
    src: "/video3.mp4", // Replace with actual video URL
  },
  {
    id: 3,
    poster: "/img22.jpeg",
    src: "/video4.mp4", // Replace with actual video URL
  },
  {
    id: 4,
    poster: "/img23.jpeg",
    src: "/video5.mp4", // Replace with actual video URL
  },
  {
    id: 5,
    poster: "/img24.jpeg",
    src: "/video6.mp4", // Replace with actual video URL
  },
  {
    id: 6,
    poster: "/img25.jpeg",
    src: "/video1.mp4", // Replace with actual video URL
  }
];

import { useEffect, useRef } from "react";

export default function VideoStrip() {
  const stripRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Force all videos to play and keep playing
    const videos = stripRef.current?.querySelectorAll("video");
    if (!videos) return;

    videos.forEach((video) => {
      // Play immediately
      video.play().catch(() => {});

      // If it pauses for any reason (like tab change), force it to play again
      video.addEventListener("pause", () => {
        video.play().catch(() => {});
      });
    });
  }, []);

  return (
    <section ref={stripRef} className="w-full h-[50vh] flex overflow-hidden bg-black">
      {VIDEOS.map((vid) => (
        <div
          key={vid.id}
          className="relative h-full flex-1 basis-[16.666%] min-w-[120px] group overflow-hidden border-r border-white/10 last:border-0 cursor-pointer"
        >
          {/* Using poster as a fallback if src is empty.
              If you add video src, it will autoplay seamlessly. */}
          <video
            src={vid.src}
            poster={vid.poster}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Play Icon on Hover to indicate it's a video */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-100 transform-gpu">
              <svg className="w-6 h-6 text-white ml-1 shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Mock Social Icon / Branding on bottom left */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.20 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="text-white text-xs font-semibold tracking-wider">@sweetdrip</span>
          </div>
        </div>
      ))}
    </section>
  );
}
