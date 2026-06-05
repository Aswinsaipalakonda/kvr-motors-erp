"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Attaches Lenis smooth scrolling inside the dashboard main content view panel.
 */
export default function DashboardSmoothScroll() {
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const lenis = new Lenis({
      wrapper: mainElement,
      content: mainElement.firstElementChild as HTMLElement || mainElement,
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
