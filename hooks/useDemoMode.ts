"use client";

import { useEffect, useState } from "react";
import { getDemoMode, setDemoMode } from "@/lib/demoMode";

/**
 * Customer storefront is clean by default.
 * Enable merchant/demo chrome with `?demo=true` or Ctrl/Cmd+Shift+D.
 */
export function useDemoMode() {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setDemo(getDemoMode());

    const onCustom = (e: Event) => {
      setDemo(Boolean((e as CustomEvent).detail));
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const next = !getDemoMode();
        setDemoMode(next);
        setDemo(next);
      }
    };

    window.addEventListener("sweetdrip-demo", onCustom);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("sweetdrip-demo", onCustom);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return demo;
}
