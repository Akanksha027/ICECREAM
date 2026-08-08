"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // If we've scrolled past 100px or the hero height, change state.
      // 100vh might be a good breakpoint, let's say after 50px so it's sticky immediately when leaving top.
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // check immediately
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[9999] transition-all duration-300 ${
        scrolled
          ? "bg-[#E390A1]/85 backdrop-blur-md shadow-md border-b border-white/20"
          : "bg-black/10 backdrop-blur-md border-b border-white/10"
      }`}
    >
      <nav className="flex items-center justify-between px-6 md:px-12 py-3 text-white">
        <div className="flex flex-col">
          <span className="font-script text-yellow-300 text-xl md:text-2xl leading-none rotate-[-5deg] w-max">
            C&amp;A
          </span>
          <span className="font-display text-[9px] md:text-xs font-bold tracking-tight mt-0.5 text-white">
            Cafe and Creamery&trade;
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium tracking-wide">
          <a href="#home" className="opacity-90 hover:opacity-100 flex flex-col items-center relative">
            Home
            <span className="w-4 h-[2px] bg-yellow-300 mt-1 absolute -bottom-2" />
          </a>
          <a href="#about" className="opacity-90 hover:opacity-100">About Us</a>
          <a href="#menu" className="opacity-90 hover:opacity-100">Menu</a>
          <a href="#gallery" className="opacity-90 hover:opacity-100">Gallery</a>
          <a href="#catering" className="opacity-90 hover:opacity-100">Catering</a>
          <a href="#location" className="opacity-90 hover:opacity-100">Location</a>
          <a href="#faq" className="opacity-90 hover:opacity-100">FAQ</a>
          <a href="#contact" className="opacity-90 hover:opacity-100">Contact us</a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="#menu"
            className="hidden md:inline-block border-2 border-white/80 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-white hover:text-[#DA758C] transition-all duration-300 shadow-sm"
          >
            Order Now
          </a>
          <button className="lg:hidden flex flex-col gap-1.5 p-1" aria-label="Open menu">
            <span className="w-5 h-[2px] bg-white rounded-full" />
            <span className="w-5 h-[2px] bg-white rounded-full" />
            <span className="w-5 h-[2px] bg-white rounded-full" />
          </button>
        </div>
      </nav>
    </header>
  );
}
