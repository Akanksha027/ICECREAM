"use client";

import { motion } from "framer-motion";
import DripDivider from "./DripDivider";

const CUPCAKES = [
  {
    id: 1,
    name: "Rocky Road Cupcake",
    description: "Cool 5 minutes in pans then remove and place on wire racks to cool completely.",
    price: "$14.25",
    image: "/img20.jpeg",
  },
  {
    id: 2,
    name: "Sugar Free Cupcake",
    description: "Once cupcakes are completely cooled, frost with your favorite frosting recipe or decorate as you desire.",
    price: "$8.50",
    image: "/img25.jpeg",
  },
  {
    id: 3,
    name: "Chocolate Cherry Cupcake",
    description: "Spoon cupcake batter into paper liners until 1/2 to 2/3 full.",
    price: "$11",
    image: "/img19.jpeg",
  }
];

export default function Showcase() {
  return (
    <section className="relative bg-raspberry text-showcase-cream">
      <DripDivider color="#FAECE5" />
      <div className="relative mx-auto max-w-6xl px-6 py-2">

        {/* Cupcakes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {CUPCAKES.map((cupcake, idx) => (
            <motion.div
              key={cupcake.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="flex flex-col items-start"
            >
              <div className="w-full h-80 relative mb-6 flex justify-center items-center">
                <img
                  src={cupcake.image}
                  alt={cupcake.name}
                  className="w-full h-full object-cover rounded-2xl shadow-lg z-10"
                />
              </div>

              <h3 className="text-white font-display text-xl md:text-2xl font-bold mb-3 drop-shadow-sm">
                {cupcake.name}
              </h3>

              <p className="text-showcase-cream/90 font-body text-sm leading-relaxed min-h-[60px] mb-4 pr-4">
                {cupcake.description}
              </p>

              <div className="w-4 h-[2px] bg-white/30 mb-4" />

              <div className="flex items-center justify-between w-full mt-auto">
                <span className="text-white font-bold text-lg">
                  {cupcake.price}
                </span>
                <button className="border border-white/50 text-showcase-cream hover:border-white hover:text-white hover:bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide transition-all rounded-sm">
                  Add to cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <DripDivider color="#FAECE5" flip />
    </section>
  );
}
