"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

/**
 * Mounts a global Lenis instance for buttery window-level smooth scrolling
 * on non-dashboard routes (landing page, login, etc.).
 *
 * For dashboard pages, we destroy this window-level instance so it does
 * not hijack scroll gestures on the inner scroll panels.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboard = pathname.startsWith("/owner") || 
                        pathname.startsWith("/supervisor") || 
                        pathname.startsWith("/sales") || 
                        pathname.startsWith("/telecaller") ||
                        pathname.startsWith("/staff");
    if (isDashboard) return;

    // Respect users who prefer reduced motion.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
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
  }, [pathname]);

  return <>{children}</>;
}
