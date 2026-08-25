import { useEffect, useMemo, useState } from "react";

type Circle = { size: number; top: number; side: "left" | "right"; offset: number; tone: "blue" | "mist" };

function seeded(seed: string) {
  let value = 0;
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function buildCircles(seed: string, height: number, viewportHeight: number): Circle[] {
  const random = seeded(seed);
  const squares = Math.max(1, Math.ceil(height / Math.max(1, viewportHeight)));
  const circles: Circle[] = [];
  for (let index = 0; index < squares * 2; index += 1) {
    const row = Math.floor(index / 2);
    circles.push({
      size: Math.round(100 + random() * 200),
      top: Math.min(Math.max(3, ((row + 0.18 + random() * 0.64) / squares) * 100), 97),
      side: index % 2 === 0 ? "left" : "right",
      offset: Math.round(2 + random() * 12),
      tone: random() > 0.45 ? "blue" : "mist",
    });
  }
  return circles;
}

export function BackgroundCircleField({ seed }: { seed?: string }) {
  const [pageHeight, setPageHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const routeSeed = seed ?? (typeof window === "undefined" ? "bilc" : window.location.pathname);

  useEffect(() => {
    const measure = () => {
      setPageHeight(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
      setViewportHeight(window.innerHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const circles = useMemo(() => buildCircles(routeSeed, pageHeight || 1, viewportHeight || 1), [pageHeight, routeSeed, viewportHeight]);
  return <div className="dynamic-circle-field" aria-hidden="true">{circles.map((circle, index) => <span key={`${routeSeed}-${index}`} className={`dynamic-circle dynamic-circle--${circle.side} dynamic-circle--${circle.tone}`} style={{ "--circle-size": `${circle.size}px`, "--circle-top": `${circle.top}%`, "--circle-offset": `${circle.offset}%` } as React.CSSProperties} />)}</div>;
}
