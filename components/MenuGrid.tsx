"use client";

import { useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

type CartItem = (typeof ITEMS)[number] & { id: string };

function PolaroidCard({
  item,
  i,
  onAdd,
  onBuy,
}: {
  item: (typeof ITEMS)[number];
  i: number;
  onAdd: (item: (typeof ITEMS)[number]) => void;
  onBuy: (item: (typeof ITEMS)[number]) => void;
}) {
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
      className="group relative rounded-md border border-border bg-polaroid p-3 pb-5 shadow-md transition-shadow hover:shadow-2xl flex flex-col justify-between"
    >
      <div>
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
      </div>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => onAdd(item)}
          className="flex-1 rounded-full border-2 border-[#E390A1] text-[#DA758C] hover:bg-[#E390A1] hover:text-white py-2 text-xs font-bold transition-all"
        >
          Add to Cart
        </button>
        <button
          onClick={() => onBuy(item)}
          className="flex-1 rounded-full bg-[#DA758C] text-white py-2 text-xs font-bold hover:bg-[#c9637a] shadow-sm transition-all"
        >
          Buy Now
        </button>
      </div>
    </motion.div>
  );
}

export default function MenuGrid() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAdd = (item: (typeof ITEMS)[number]) => {
    setCart((prev) => [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const handleBuy = (item: (typeof ITEMS)[number]) => {
    handleAdd(item);
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + parseFloat(item.price.replace("$", "")), 0);

  return (
    <section id="menu" className="relative bg-blush/40 pt-12 pb-24 md:pt-16 md:pb-32">
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
            <PolaroidCard key={item.name} item={item} i={i} onAdd={handleAdd} onBuy={handleBuy} />
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#DA758C] text-white shadow-xl hover:scale-105 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-brown">
            {cart.length}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l border-white/20 bg-[#FDF6F5] p-6 shadow-2xl overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-semibold text-brown">Your Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full bg-white p-2 text-brown shadow-sm hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                  <p className="text-sm font-medium text-brown">Your cart is currently empty.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm border border-black/5">
                      <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                      <div className="flex-1">
                        <p className="font-medium text-brown text-sm">{item.name}</p>
                        <p className="font-semibold text-bright-raspberry text-xs mt-1">{item.price}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-brown/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-medium text-brown">Total</span>
                  <span className="font-display font-semibold text-2xl text-bright-raspberry">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <CheckoutFlow cart={cart} setCart={setCart} setIsCartOpen={setIsCartOpen} totalAmount={totalAmount} ITEMS={ITEMS} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function CheckoutFlow({
  cart,
  setCart,
  setIsCartOpen,
  totalAmount,
  ITEMS,
}: {
  cart: CartItem[];
  setCart: any;
  setIsCartOpen: any;
  totalAmount: number;
  ITEMS: any[];
}) {
  const [state, setState] = useState<"idle" | "analyzing" | "offer" | "processing" | "success">("idle");
  const [offerItem, setOfferItem] = useState<any>(null);

  const startCheckout = () => {
    setState("analyzing");
    // Simulate AI analyzing cart
    setTimeout(() => {
      // Pick an item not in cart
      const cartNames = cart.map((c) => c.name);
      const availableUpsells = ITEMS.filter((i) => !cartNames.includes(i.name));
      if (availableUpsells.length > 0 && Math.random() > 0.3) {
        setOfferItem(availableUpsells[Math.floor(Math.random() * availableUpsells.length)]);
        setState("offer");
      } else {
        processOrder();
      }
    }, 1500);
  };

  const processOrder = () => {
    setState("processing");
    setTimeout(() => {
      setState("success");
      setTimeout(() => {
        setCart([]);
        setIsCartOpen(false);
        setState("idle");
      }, 3000);
    }, 2000);
  };

  const acceptOffer = () => {
    setCart((prev: any) => [...prev, { ...offerItem, id: Math.random().toString(36).substr(2, 9), price: "$2.00" }]); // Discounted price!
    processOrder();
  };

  if (state === "idle") {
    return (
      <button
        disabled={cart.length === 0}
        className="w-full rounded-full bg-[#DA758C] text-white py-4 font-bold tracking-wide hover:bg-[#c9637a] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        onClick={startCheckout}
      >
        Checkout
      </button>
    );
  }

  if (state === "analyzing") {
    return (
      <div className="w-full rounded-full bg-gray-100 py-4 flex items-center justify-center gap-3 border border-gray-200 text-brown">
        <span className="flex size-4 items-center justify-center rounded-full bg-blue-500/20 pulse-dot">
          <span className="size-2 rounded-full bg-blue-500" />
        </span>
        <span className="text-sm font-medium animate-pulse">Profit Pilot AI is analyzing your order...</span>
      </div>
    );
  }

  if (state === "offer") {
    return (
      <div className="w-full rounded-2xl bg-blue-50 p-4 border border-blue-100 shadow-inner">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Special Offer Unlocked</span>
        </div>
        <p className="text-sm font-medium text-brown leading-snug mb-4">
          Wait! Want to add a <span className="font-bold">{offerItem.name}</span> for just <span className="font-bold text-bright-raspberry">$2.00</span>?
        </p>
        <div className="flex gap-2">
          <button onClick={processOrder} className="flex-1 rounded-full bg-white text-brown py-2 text-xs font-bold border border-brown/20 hover:bg-gray-50 transition-all">
            No thanks
          </button>
          <button onClick={acceptOffer} className="flex-1 rounded-full bg-blue-500 text-white py-2 text-xs font-bold hover:bg-blue-600 shadow-sm transition-all">
            Add to Order
          </button>
        </div>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="w-full rounded-full bg-gray-100 py-4 flex items-center justify-center gap-2 text-brown">
        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium">Redirecting to Razorpay...</span>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="w-full rounded-full bg-green-50 py-4 flex items-center justify-center gap-2 text-green-700 border border-green-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        <span className="text-sm font-bold">Payment Simulator Complete!</span>
      </div>
    );
  }

  return null;
}
