"use client";

import { motion } from "framer-motion";

const CARDS = [
  {
    id: "card-1",
    bg: "#FF6B6B",
    title: "Watermelon & Spearmint",
    image:
      "/img1.jpeg",
  },
  {
    id: "card-2",
    bg: "#F39C12",
    title: "Spicy Mango",
    image:
      "/img2.jpeg",
  },
  {
    id: "card-3",
    bg: "#F1C40F",
    title: "Lemon Zest",
    image:
      "/img3.jpeg",
  },
  {
    id: "card-4",
    bg: "#1ABC9C",
    title: "Cool Mint",
    image:
      "/img4.jpeg",
  },
];

export default function FlavorsShowcase() {
  return (
    <section className="w-full flex flex-col lg:flex-row min-h-screen">
      {/* Left Panel */}
      <div className="w-full lg:w-1/3 bg-[#F23B5A] p-10 md:p-16 lg:p-20 flex flex-col justify-center relative text-white z-10">
        <h2 className="font-script text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight">
          Flavors That Hit Different
        </h2>
        <p className="font-body text-sm md:text-base leading-relaxed opacity-90 mb-10 max-w-md">
          Who said craft ice cream can't have a little fun? Our classic gets a
          natural twist with 100% real flavors (never artificial, never overly
          sweet). From Spicy Mango to Watermelon & Spearmint to Bright Lemon,
          each scoop is handcrafted to bring a California-cool vibe to your cone.
        </p>
        
        <div className="flex flex-col xl:flex-row xl:items-center gap-6 mt-4">
          <button className="border-2 border-white px-8 py-3 text-sm font-semibold tracking-wider hover:bg-white hover:text-[#F23B5A] transition-colors whitespace-nowrap self-start xl:self-auto">
            Shop all flavors
          </button>
          
          <div className="relative flex items-center">
            <span className="font-script text-3xl md:text-4xl text-white ml-2 md:ml-4 leading-tight">
              Or pick your favorite!
            </span>
            {/* Elegant swooping arrow pointing to the cards */}
            <svg
              className="absolute top-1/2 -translate-y-1/2 -right-24 w-20 h-20 text-white hidden lg:block drop-shadow-md"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M2 12 C 8 4, 16 4, 22 12" />
              <path d="M 16 12 L 22 12 L 18 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Panel (4 sections equivalent to roughly 2/3 width or 4/6 columns) */}
      <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2">
        {CARDS.map((card, idx) => (
          <div
            key={card.id}
            className="relative aspect-square sm:aspect-auto sm:h-[50vh] p-4 md:p-6 flex items-center justify-center overflow-hidden group"
            style={{ backgroundColor: card.bg }}
          >
            <motion.div 
              className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </motion.div>

          </div>
        ))}
      </div>
    </section>
  );
}
