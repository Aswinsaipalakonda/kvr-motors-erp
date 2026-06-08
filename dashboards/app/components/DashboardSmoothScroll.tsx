"use client";

/**
 * DashboardSmoothScroll is disabled because smooth scroll hijacking (Lenis)
 * conflicts with dynamic React content rendering (loading states, tab switching)
 * and nested scroll areas (Kanban columns, tables).
 * Disabling this allows the browser's native, highly-optimized scrolling to handle the view.
 */
export default function DashboardSmoothScroll() {
  return null;
}
