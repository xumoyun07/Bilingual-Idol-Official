import { useEffect } from "react";
import { useLocation } from "wouter";

export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Disable automatic browser scroll restoration so page transitions always start at top
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      const html = document.documentElement;
      const originalScrollBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";

      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      html.scrollTop = 0;
      document.body.scrollTop = 0;

      const mainContent = document.getElementById("main-content");
      if (mainContent) {
        mainContent.scrollTop = 0;
      }

      const root = document.getElementById("root");
      if (root) {
        root.scrollTop = 0;
      }

      requestAnimationFrame(() => {
        html.style.scrollBehavior = originalScrollBehavior;
      });
    };

    // Execute immediately on route change
    resetScroll();

    // Re-verify on animation frame and short delay to cover async rendering and layout shifts
    const frameId = requestAnimationFrame(resetScroll);
    const timerId = setTimeout(resetScroll, 50);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
    };
  }, [location]);

  return null;
}
