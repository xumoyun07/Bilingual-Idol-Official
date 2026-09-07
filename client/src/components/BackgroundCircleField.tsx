import { useEffect, useMemo, useState } from "react";

function seeded(seed: string) {
  let value = 0;
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

type PlacedCircle = {
  size: number;
  topPx: number;
  side: "left" | "right";
  pos: string;
  opacity: number;
};

function generateNonOverlappingCircles(
  seed: string,
  docHeight: number,
  isMobile: boolean
): PlacedCircle[] {
  const random = seeded(seed);
  const placed: PlacedCircle[] = [];
  const sides: Array<"left" | "right"> = ["left", "right"];

  // In mobile version: sizes are 75px-150px (2x smaller), gap is 150px (2x smaller)
  // In desktop version: sizes are 150px-300px, gap is 300px
  const minSize = isMobile ? 75 : 150;
  const maxSize = isMobile ? 150 : 300;
  const MIN_CLEAR_GAP = isMobile ? 150 : 300;

  sides.forEach((side, sideIndex) => {
    const sideCircles: Array<{
      size: number;
      xCenter: number;
      yCenter: number;
      pos: string;
      opacity: number;
    }> = [];

    const startOffset = isMobile ? 40 : 70;
    const sideStagger = isMobile ? 80 : 160;
    let currentY = startOffset + (sideIndex === 1 ? sideStagger : 0) + Math.round(random() * (isMobile ? 40 : 80));
    const maxY = docHeight - (isMobile ? 45 : 90);

    while (currentY < maxY) {
      // Strict randomized size between minSize and maxSize
      const size = Math.min(maxSize, Math.max(minSize, Math.round(minSize + random() * (maxSize - minSize))));
      const radius = size / 2;

      // 4 varied lateral placement archetypes scaled for device
      const styleType = Math.floor(random() * 4);
      let xOffset = 0;
      if (styleType === 0) {
        // Deep outer peek (peeking crescent from edge)
        xOffset = -Math.round(size * (0.48 + random() * 0.22));
      } else if (styleType === 1) {
        // Center-edge (centered directly across the border)
        xOffset = -Math.round(size * (0.22 + random() * 0.20));
      } else if (styleType === 2) {
        // Margin tangent (sitting inside and touching border)
        xOffset = Math.round((isMobile ? 2 : 5) + random() * (isMobile ? 15 : 30));
      } else {
        // Floating inside side margin gutter
        xOffset = Math.round((isMobile ? 16 : 40) + random() * (isMobile ? 24 : 65));
      }

      const xCenter = xOffset + radius;
      const yCenter = currentY;

      // Strict clear edge-to-edge distance between spheres on the same edge
      let collides = false;
      for (const existing of sideCircles) {
        const dx = xCenter - existing.xCenter;
        const dy = yCenter - existing.yCenter;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const edgeToEdgeDist = dist - (radius + existing.size / 2);
        if (edgeToEdgeDist < MIN_CLEAR_GAP) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        const opacity = Math.round((0.52 + random() * 0.28) * 100) / 100;
        sideCircles.push({
          size,
          xCenter,
          yCenter,
          pos: `${xOffset}px`,
          opacity,
        });
        // Advance Y coordinate by radius + minimum clear gap + next margin + random jitter
        currentY += Math.round(radius + MIN_CLEAR_GAP + (isMobile ? 45 : 90) + random() * (isMobile ? 45 : 90));
      } else {
        // Step forward slightly to test the next viable slot
        currentY += isMobile ? 30 : 60;
      }
    }

    sideCircles.forEach((c) => {
      placed.push({
        size: c.size,
        topPx: c.yCenter,
        side,
        pos: c.pos,
        opacity: c.opacity,
      });
    });
  });

  return placed;
}

export function BackgroundCircleField({ seed }: { seed?: string }) {
  const [pageHeight, setPageHeight] = useState(1200);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const routeSeed = seed ?? (typeof window === "undefined" ? "bilc" : window.location.pathname);

  useEffect(() => {
    const measure = () => {
      const docHeight = Math.max(
        document.documentElement?.scrollHeight || 0,
        document.body?.scrollHeight || 0,
        document.documentElement?.offsetHeight || 0,
        window.innerHeight || 800
      );
      setPageHeight(docHeight);
      setIsMobile((window.innerWidth || 800) < 768);
    };

    measure();
    const rafId = requestAnimationFrame(measure);
    const timer = setTimeout(measure, 200);

    const observer = new ResizeObserver(measure);
    if (document.documentElement) observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [routeSeed]);

  const circles = useMemo(() => {
    return generateNonOverlappingCircles(routeSeed, Math.max(pageHeight, 900), isMobile);
  }, [pageHeight, routeSeed, isMobile]);

  return (
    <div className="dynamic-circle-field" aria-hidden="true">
      {circles.map((circle, index) => (
        <span
          key={`${routeSeed}-${circle.side}-${index}-${isMobile ? "m" : "d"}`}
          className={`dynamic-circle dynamic-circle--${circle.side}`}
          style={{
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            top: `${circle.topPx}px`,
            opacity: circle.opacity,
            "--circle-size": `${circle.size}px`,
            "--circle-pos": circle.pos,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}


