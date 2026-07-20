"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * DashboardSmoothScroll attaches a Lenis instance targeted directly to the dashboard
 * inner scroll container, producing silky smooth, 60fps momentum wheel and touch scrolling.
 */
export default function DashboardSmoothScroll({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return;

    // Respect reduced motion settings
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5,
      wheelMultiplier: 1.0,
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

  return (
    <div
      ref={wrapperRef}
      className={`flex-1 overflow-y-auto smooth-scroll slim-scrollbar min-h-0 ${className}`}
      style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain" }}
    >
      <div ref={contentRef} className="min-h-full">
        {children}
      </div>
    </div>
  );
}
