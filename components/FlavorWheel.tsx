"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FlavorWheel() {
  return (
    <section id="flavors" className="relative bg-[#FBF2EE] py-24 md:py-32 min-h-[90vh] flex items-center overflow-hidden">
      
      {/* Floating Strawberries */}
      <img 
        src="/img5.jpeg" 
        alt="Strawberry"
        className="absolute top-0 left-[45%] w-40 h-40 object-cover rounded-full mix-blend-multiply opacity-80 -translate-y-1/2 pointer-events-none"
      />
      <img 
        src="/img6.jpeg" 
        alt="Strawberry"
        className="absolute left-0 top-[60%] w-28 h-28 object-cover rounded-full mix-blend-multiply opacity-80 -translate-x-1/2 pointer-events-none"
      />

      <div className="mx-auto flex flex-col md:flex-row max-w-7xl w-full px-6 md:px-12 relative z-10">
        
        {/* LEFT COPY */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h2 className="font-display text-5xl md:text-[5.5rem] font-extrabold text-[#3B1F1C] mb-4 tracking-tight leading-none">
            Craft ice cream
          </h2>
          <p className="text-[#3B1F1C] text-xl font-medium mb-12">150 gr</p>
          
          <div className="flex flex-wrap items-center gap-4 mb-24">
            <button className="bg-[#E97676] text-white px-12 py-3.5 rounded-full font-semibold tracking-wide shadow-[0_15px_30px_rgba(233,118,118,0.4)] hover:scale-105 transition-transform duration-300">
              BUY
            </button>
            <button className="border border-[#D9C9C5] text-[#A6908D] px-10 py-3.5 rounded-full font-medium hover:bg-white transition-colors duration-300">
              + ADD TOPPING
            </button>
          </div>

          {/* Bottom Left Info */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full border border-[#D9C9C5] flex items-center justify-center shrink-0">
               {/* "BIO ECO" Text */}
               <div className="absolute -left-5 text-[#E97676] font-extrabold text-xl leading-none">
                 BIO<br/>ECO
               </div>
               {/* Milk glass placeholder - using unsplash milk splash */}
               <div className="w-[85%] h-[85%] rounded-full overflow-hidden">
                 <img src="/img7.jpeg" alt="Milk" className="w-full h-full object-cover mix-blend-multiply" />
               </div>
            </div>
            
            <p className="text-[13px] text-[#A6908D] max-w-[160px] leading-relaxed">
              We use only organic milk. You can watch a video on how we prepare ice cream for you.
            </p>
            
            <button className="w-10 h-10 rounded-full border border-[#D9C9C5] flex items-center justify-center text-[#E97676] hover:bg-[#E97676] hover:text-white transition-colors shrink-0 group">
              <svg className="w-3 h-3 ml-0.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT WHEEL & STATS */}
        <div className="w-full md:w-1/2 relative mt-20 md:mt-0 flex justify-center md:justify-end items-center">
          
          {/* Circular Wheel Background Container */}
          <div className="relative w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px]">
            {/* The thin circle border */}
            <div className="absolute inset-8 rounded-full border-[1px] border-[#D9C9C5]/80" />
            
            {/* The SVG text on path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500">
               <defs>
                 {/* Circle path starting from left (50, 250) and arching over the top to right (450, 250) */}
                 <path id="textCircle" d="M 32,250 A 218,218 0 1,1 468,250" />
               </defs>
               
               <text className="text-[10px] font-semibold tracking-[0.25em] uppercase fill-[#A6908D]">
                 <textPath href="#textCircle" startOffset="10%" textAnchor="start">
                   PISTACHIO <tspan dx="15" dy="-3">•</tspan>
                   <tspan dx="15" dy="3">KIVI</tspan> <tspan dx="15" dy="-3">•</tspan>
                   <tspan dx="15" dy="3" fill="#E97676">STRAWBERRY</tspan> <tspan dx="15" dy="-3">•</tspan>
                   <tspan dx="15" dy="3">RASPBERRY</tspan> <tspan dx="15" dy="-3">•</tspan>
                   <tspan dx="15" dy="3">PEACH</tspan> <tspan dx="15" dy="-3">•</tspan>
                   <tspan dx="15" dy="3">BANANA</tspan>
                 </textPath>
               </text>

               {/* Decorative dots on the inner ring border (radius 210, inset 8 means r=250-32=218) */}
               {/* Left dot */}
               <circle cx="32" cy="250" r="3" fill="#3B1F1C" />
               {/* Top dot */}
               <circle cx="250" cy="32" r="3" fill="#D9C9C5" />
            </svg>

            {/* Center Ice Cream Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/img8.jpeg"
                alt="Raspberry Cone"
                className="w-[85%] h-[85%] object-cover rounded-full mix-blend-multiply drop-shadow-2xl translate-y-6 md:translate-y-12 translate-x-4 hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Stats on the right edge */}
          <div className="absolute top-10 right-0 md:-right-4 flex flex-col gap-12 text-center md:text-right z-20">
             <div className="relative">
                {/* White circle decoration behind number */}
                <div className="absolute -top-3 -right-2 w-8 h-8 bg-white/70 rounded-full -z-10 blur-[2px]" />
                <p className="font-display text-4xl md:text-[2.75rem] font-bold text-[#E97676] leading-none mb-1">10</p>
                <p className="text-sm font-medium text-[#3B1F1C]">tastes</p>
             </div>
             <div className="relative">
                <p className="font-display text-4xl md:text-[2.75rem] font-bold text-[#E97676] leading-none mb-1">23</p>
                <p className="text-sm font-medium text-[#3B1F1C] max-w-[80px] mx-auto md:ml-auto md:mr-0 leading-tight">types of topping</p>
             </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
