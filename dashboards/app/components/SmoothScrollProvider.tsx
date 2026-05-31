"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Mounts a global Lenis instance for buttery window-level smooth scrolling
 * (landing page, login, and any document-flow pages).
 *
 * Dashboard pages scroll inside their own `<main>` containers and rely on
 * native momentum scrolling (see the `smooth-scroll` utility class) so we do
 * not hijack touch gestures there — Lenis simply idles when there is no
 * window-level overflow.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Respect users who prefer reduced motion.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Keep native touch scrolling on mobile (avoids input lag on inner panels).
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

  return <>{children}</>;
}
