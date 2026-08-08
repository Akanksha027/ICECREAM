"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Left side images (slide in from left)
const LEFT_IMGS = ["/img1.jpeg", "/img3.jpeg"];
// Right side images (slide in from right)
const RIGHT_IMGS = ["/img7.jpeg", "/img19.jpeg"];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Left pair retreats left on scroll
  const leftX = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);
  // Right pair retreats right on scroll
  const rightX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  // bg.jpeg fades in as user scrolls
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section ref={containerRef} style={{ height: "220vh" }} className="relative">

      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">



        {/* ─── Background: light pink base ─── */}
        <div className="absolute inset-0 bg-[#FAECE5]" />

        {/* ─── Background image fades in as user scrolls ─── */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: bgOpacity }}
        >
          <img
            src="/bg.jpeg"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </motion.div>

        {/* ─── Image rows ─── */}
        {/* LEFT pair — each image is 25vw wide, together fill 50% of screen */}
        <motion.div
          className="absolute inset-y-0 left-0 z-20 flex"
          style={{ x: leftX }}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          {LEFT_IMGS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-full object-cover"
              style={{ width: "25vw" }}
              draggable={false}
            />
          ))}
        </motion.div>

        {/* RIGHT pair — slides in from the right, together fill 50% of screen */}
        <motion.div
          className="absolute inset-y-0 right-0 z-20 flex"
          style={{ x: rightX }}
          initial={{ x: "100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        >
          {RIGHT_IMGS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-full object-cover"
              style={{ width: "25vw" }}
              draggable={false}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
}


