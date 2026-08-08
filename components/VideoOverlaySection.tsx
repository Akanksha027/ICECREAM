"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function VideoOverlaySection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {});
    video.addEventListener("pause", () => {
      video.play().catch(() => {});
    });
  }, []);

  return (
    <section className="relative w-full h-[60vh] overflow-hidden">
      {/* Background Video (Fallback to image poster if src is empty) */}
      <video
        ref={videoRef}
        src="/video1.mp4"
        poster="/img17.jpeg"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* The Green Container overlay - positioned top right & reduced size */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-6 right-4 md:top-10 md:right-10 lg:right-16 z-10 w-[95%] sm:w-[80%] md:w-[70%] lg:w-[55%] max-w-4xl bg-[#4bc379] p-4 md:p-6 lg:p-8 flex flex-col sm:flex-row gap-4 md:gap-6 shadow-2xl"
      >
        {/* Left Image Box */}
        <div className="w-full md:w-1/2 relative aspect-video md:aspect-[4/3] bg-cream overflow-hidden shadow-md">
          <img 
            src="/img18.jpeg" 
            alt="Vibrant presentation"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* Right Content Box */}
        <div className="w-full md:w-1/2 relative aspect-video md:aspect-[4/3] overflow-hidden shadow-md">
           <img 
              src="/img19.jpeg"
              alt="Sweet treat"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
           />
        </div>
      </motion.div>
    </section>
  );
}
