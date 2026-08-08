"use client";

import { useState, MouseEvent } from "react";
import { motion } from "framer-motion";

const ITEMS = [
  {
    name: "Waffle Cone Classic",
    price: "$6.50",
    kind: "Ice cream",
    image:
      "/img9.jpeg",
  },
  {
    name: "Double Choc Chunk",
    price: "$4.00",
    kind: "Cookie",
    image:
      "/img10.jpeg",
  },
  {
    name: "Mint Pistachio Cup",
    price: "$7.00",
    kind: "Ice cream",
    image:
      "/img11.jpeg",
  },
  {
    name: "Salted Honey Stack",
    price: "$5.50",
    kind: "Cookie",
    image:
      "/img12.jpeg",
  },
  {
    name: "Raspberry Ripple Tub",
    price: "$9.00",
    kind: "Ice cream",
    image:
      "/img13.jpeg",
  },
  {
    name: "Brown Butter Chip",
    price: "$4.00",
    kind: "Cookie",
    image:
      "/img14.jpeg",
  },
];

function PolaroidCard({ item, i }: { item: (typeof ITEMS)[number]; i: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 10 });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: i % 2 === 0 ? -3 : 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -2 : 2 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: "easeOut" }}
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
      className="group relative rounded-md border border-border bg-polaroid p-3 pb-5 shadow-md transition-shadow hover:shadow-2xl"
    >
      <div className="relative overflow-hidden rounded-sm">
        <img
          src={item.image}
          alt={item.name}
          className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute left-2 top-2 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-brown">
          {item.kind}
        </span>
      </div>
      <div className="flex items-baseline justify-between px-1 pt-4">
        <h3 className="font-script text-2xl text-brown">{item.name}</h3>
        <span className="font-display font-semibold text-bright-raspberry">
          {item.price}
        </span>
      </div>
    </motion.div>
  );
}

export default function MenuGrid() {
  return (
    <section id="menu" className="bg-blush/40 pt-12 pb-24 md:pt-16 md:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-script text-2xl text-coral mb-1">the menu board</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-brown">
              Today's cases
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-brown">
            Everything below is made that morning. When a tray sells out, it
            comes off the board until the next bake.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item, i) => (
            <PolaroidCard key={item.name} item={item} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
