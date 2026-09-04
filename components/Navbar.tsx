"use client";

import { useEffect, useState } from "react";
import { BRANDS, getBrandId, setBrandId, getBrand, type StoreBrand } from "@/lib/brand";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [brand, setBrand] = useState<StoreBrand>(BRANDS[0]);

  useEffect(() => {
    setBrand(getBrand());
    const onBrand = () => setBrand(getBrand());
    window.addEventListener("sweetdrip-brand", onBrand);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("sweetdrip-brand", onBrand);
    };
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
            {brand.id === "bean" ? "B&B" : "C&A"}
          </span>
          <span className="font-display text-[9px] md:text-xs font-bold tracking-tight mt-0.5 text-white">
            {brand.name}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium tracking-wide">
          <a href="#home" className="opacity-90 hover:opacity-100 flex flex-col items-center relative">
            Home
            <span className="w-4 h-[2px] bg-yellow-300 mt-1 absolute -bottom-2" />
          </a>
          <a href="#menu" className="opacity-90 hover:opacity-100">Menu</a>
          <a href="#about" className="opacity-90 hover:opacity-100">About</a>
          <a href="#gallery" className="opacity-90 hover:opacity-100">Gallery</a>
        </div>

        <div className="flex items-center gap-3">
          <label className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Store
            <select
              value={brand.id}
              onChange={(e) => {
                setBrandId(e.target.value);
                setBrand(getBrand());
              }}
              className="rounded-full border border-white/30 bg-black/20 px-2 py-1 text-[10px] font-bold text-white outline-none"
            >
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id} className="text-brown">
                  {b.name} ({b.currency})
                </option>
              ))}
            </select>
          </label>
          <a
            href="#menu"
            className="hidden md:inline-block border-2 border-white/80 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-white hover:text-[#DA758C] transition-all duration-300 shadow-sm"
          >
            Order Now
          </a>
        </div>
      </nav>
    </header>
  );
}
