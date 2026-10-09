import React, { useEffect, useRef, useState, memo } from "react";

interface BackgroundCircleFieldProps {
  seed?: string;
}

interface Ball {
  id: number;
  cx: number; // Home center X
  cy: number; // Home center Y
  vx: number;
  vy: number;
  displacementX: number; // Dynamic physical displacement offset
  displacementY: number; // Dynamic physical displacement offset
  r: number;
  side: "left" | "right";
}

export const BackgroundCircleField = memo(function BackgroundCircleField({ seed = "default-seed" }: BackgroundCircleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Balls list stored in React state for DOM rendering, and in refs for high-speed physics access
  const [balls, setBalls] = useState<Ball[]>([]);
  const ballsRef = useRef<Ball[]>([]);
  const ballDomRefs = useRef<{ [id: number]: HTMLDivElement | null }>({});
  const lastAppliedTransformsRef = useRef<{ [id: number]: string }>({});
  
  const pointerRef = useRef({ x: -1000, y: -1000 });
  
  // High-performance refs for dimensions
  const widthRef = useRef(1200);
  const heightRef = useRef(1000);
  const lastWidthRef = useRef(0);
  const lastSeedRef = useRef("");
  const generatedScreensRef = useRef<Set<number>>(new Set());

  // High-precision scroll tracking
  const targetScrollYRef = useRef(0);

  const [reducedMotion, setReducedMotion] = useState(false);

  // Extremely smooth, slow, and elegant swaying parameters for state of rest (halved speed)
  const getSway = (time: number, id: number) => {
    return {
      x: Math.sin(time * 0.000375 + id * 1.7) * 55, 
      y: Math.cos(time * 0.000300 + id * 2.3) * 55, 
    };
  };

  // Boundaries calculation to keep spheres strictly in the left/right side margins
  const getSideBoundaries = (side: "left" | "right", w: number, r: number) => {
    const margin = Math.max(20, (w - 1216) / 2); // 1216px - central content zone width
    if (side === "left") {
      const maxX = margin > 100 ? margin + 60 : w * 0.22;
      return { minX: r + 15, maxX: Math.max(r + 45, maxX) };
    } else {
      const minX = margin > 100 ? w - margin - 60 : w * 0.78;
      return { minX: Math.min(w - r - 45, minX), maxX: w - r - 15 };
    }
  };

  // 1. Detect Accessibility Preferences (prefers-reduced-motion)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // 2. Track pointer position in viewport space for repulsion
  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: -1000, y: -1000 };
    };

    // Mobile tap shockwave push handler (Pointer Down trigger)
    const handlePointerDown = (e: PointerEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY + targetScrollYRef.current;

      ballsRef.current.forEach((ball) => {
        const sway = getSway(performance.now(), ball.id);
        const currentX = ball.cx + sway.x + ball.displacementX;
        const currentY = ball.cy + sway.y + ball.displacementY;

        const dx = currentX - clickX;
        const dy = currentY - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const blastRadius = 250;

        if (dist < blastRadius) {
          // Extremely gentle mobile pulse for a soft, liquid-like dispersion with no abrupt movements (halved force)
          const force = (1 - dist / blastRadius) * 0.075; 
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          ball.vx += nx * force;
          ball.vy += ny * force;
        }
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [reducedMotion]);

  // 3. Initialize/Append Spheres dynamically based on Document height
  const updateSpheres = () => {
    const width = widthRef.current;
    const documentHeight = heightRef.current;
    const screenHeight = window.innerHeight || 800;
    const numScreens = Math.max(1, Math.ceil(documentHeight / screenHeight));

    const widthDiff = Math.abs(width - lastWidthRef.current);
    const seedChanged = seed !== lastSeedRef.current;

    // Reset if layout changed significantly or seed changed
    if (ballsRef.current.length === 0 || widthDiff > 100 || seedChanged) {
      ballsRef.current = [];
      generatedScreensRef.current = new Set();
      lastWidthRef.current = width;
      lastSeedRef.current = seed;
    }

    // Seed hashing to number
    let seedHash = 0;
    for (let i = 0; i < seed.length; i++) {
      seedHash = (seedHash << 5) - seedHash + seed.charCodeAt(i);
      seedHash |= 0;
    }
    seedHash = Math.abs(seedHash) || 1;

    const list = [...ballsRef.current];
    let maxId = list.reduce((max, b) => Math.max(max, b.id), -1);
    let ballId = maxId + 1;

    const sides: ("left" | "right")[] = ["left", "right"];

    for (let s = 0; s < numScreens; s++) {
      if (generatedScreensRef.current.has(s)) {
        continue;
      }

      const screenYStart = s * screenHeight;

      for (const side of sides) {
        // Balanced count of 2 to 4 spheres per side per screen, seed-stable
        let sideSeed = seedHash + s * 79 + (side === "left" ? 13 : 37);
        const randomForSide = () => {
          const x = Math.sin(sideSeed++) * 10000;
          return x - Math.floor(x);
        };

        const countOnSide = 2 + Math.floor(randomForSide() * 3); // 2, 3, or 4
        const segmentHeight = screenHeight / countOnSide;

        for (let j = 0; j < countOnSide; j++) {
          const r = 25 + randomForSide() * 75; // Radius: 25px - 100px (Diameter: 50px - 200px)
          const bounds = getSideBoundaries(side, width, r);

          // Uniform horizontal distribution
          const startX = bounds.minX + randomForSide() * (bounds.maxX - bounds.minX);

          // Strictly slot heights vertically to enforce 100px - 400px gaps
          const slotYStart = screenYStart + j * segmentHeight;
          const slotMinY = slotYStart + r + 35;
          const slotMaxY = slotYStart + segmentHeight - r - 35;
          const startY = slotMinY + randomForSide() * (Math.max(10, slotMaxY - slotMinY));

          list.push({
            id: ballId++,
            cx: startX,
            cy: startY,
            vx: 0,
            vy: 0,
            displacementX: 0,
            displacementY: 0,
            r,
            side,
          });
        }
      }

      generatedScreensRef.current.add(s);
    }

    ballsRef.current = list;
    setBalls(list);
  };

  // 4. Manage Viewport Resize and height tracking
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight,
        1000
      );

      widthRef.current = width;
      heightRef.current = height;

      updateSpheres();
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Check periodically for scrollHeight updates (e.g. dynamic content loads) without scroll events
    const interval = setInterval(() => {
      const currentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight,
        1000
      );
      if (Math.abs(currentHeight - heightRef.current) > 10) {
        heightRef.current = currentHeight;
        updateSpheres();
      }
    }, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, [seed]);

  // 5. Scroll Tracker (Saves scrollY to ref for pointer coordinate conversion)
  useEffect(() => {
    const handleScroll = () => {
      targetScrollYRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 6. Physics Animation Loop (Runs physical updates and updates DOM transforms directly for ultra-performance)
  useEffect(() => {
    const tick = (time: number) => {
      const targetScrollY = targetScrollYRef.current;
      const w = window.innerWidth;
      const spheres = ballsRef.current;
      const pointer = pointerRef.current;

      // Physics, Harmonic Swaying at rest, and responsive repulsion
      spheres.forEach((ball) => {
        // Calculate organic swaying coordinates for state of rest
        const sway = getSway(time, ball.id);

        const currentX = ball.cx + sway.x + ball.displacementX;
        const currentY = ball.cy + sway.y + ball.displacementY;

        const ballViewportY = currentY - targetScrollY;
        const dx = currentX - pointer.x;
        const dy = ballViewportY - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxInfluence = 220;

        if (dist < maxInfluence) {
          // Extremely gentle, luxurious fluid-like repulsion for super smooth sliding (halved force)
          const force = (1 - dist / maxInfluence) * 0.01; 
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          ball.vx += nx * force;
          ball.vy += ny * force;
        }

        // Spring restoring force pulls active displacement back to home zone (halved return speed)
        ball.vx += (0 - ball.displacementX) * 0.00025;
        ball.vy += (0 - ball.displacementY) * 0.00025;

        // Rich liquid viscosity damping for high-deceleration smooth settling (friction: 0.955)
        ball.vx *= 0.955;
        ball.vy *= 0.955;

        // Apply velocity with half-speed multiplier to ensure physics is perfectly smooth & half as fast!
        ball.displacementX += ball.vx * 0.5;
        ball.displacementY += ball.vy * 0.5;

        // Re-calculate positions after physics updates
        const finalX = ball.cx + sway.x + ball.displacementX;
        const finalY = ball.cy + sway.y + ball.displacementY;

        // Soft elastic boundaries (absolutely no hard clamping or sharp teleport bounces!)
        const bounds = getSideBoundaries(ball.side, w, ball.r);
        if (ball.side === "left") {
          if (finalX - ball.r < bounds.minX - 50) {
            const depth = (bounds.minX - 50) - (finalX - ball.r);
            ball.vx += depth * 0.0008; // soft magnetic cushion push
          } else if (finalX + ball.r > bounds.maxX) {
            const depth = (finalX + ball.r) - bounds.maxX;
            ball.vx -= depth * 0.0008; // soft magnetic cushion push
          }
        } else {
          if (finalX - ball.r < bounds.minX) {
            const depth = bounds.minX - (finalX - ball.r);
            ball.vx += depth * 0.0008; // soft magnetic cushion push
          } else if (finalX + ball.r > bounds.maxX + 50) {
            const depth = (finalX + ball.r) - (bounds.maxX + 50);
            ball.vx -= depth * 0.0008; // soft magnetic cushion push
          }
        }

        if (finalY - ball.r < -30) {
          const depth = -30 - (finalY - ball.r);
          ball.vy += depth * 0.0008; // soft magnetic cushion push
        } else if (finalY + ball.r > heightRef.current + 30) {
          const depth = (finalY + ball.r) - (heightRef.current + 30);
          ball.vy -= depth * 0.0008; // soft magnetic cushion push
        }

        // Direct DOM update of 100% native absolute scrolling elements
        // Optimized to only update visible elements and round positions to 0.5px to completely eliminate sub-pixel jitter & main-thread layout thrashing!
        const dom = ballDomRefs.current[ball.id];
        if (dom) {
          const screenHeight = window.innerHeight || 800;
          const isVisible = finalY + ball.r >= targetScrollY - 300 && finalY - ball.r <= targetScrollY + screenHeight + 300;

          if (isVisible) {
            const finalXRounded = Math.round((finalX - ball.r) * 2) / 2;
            const finalYRounded = Math.round((finalY - ball.r) * 2) / 2;
            const transformStr = `translate3d(${finalXRounded}px, ${finalYRounded}px, 0)`;

            if (lastAppliedTransformsRef.current[ball.id] !== transformStr) {
              dom.style.transform = transformStr;
              lastAppliedTransformsRef.current[ball.id] = transformStr;
            }
            if (dom.style.display === "none") {
              dom.style.display = "block";
            }
          } else {
            if (dom.style.display !== "none") {
              dom.style.display = "none";
            }
          }
        }
      });

      // Collision Separation (ensures spheres stay apart strictly with high physical damping)
      const passes = 3;
      for (let p = 0; p < passes; p++) {
        for (let i = 0; i < spheres.length; i++) {
          for (let j = i + 1; j < spheres.length; j++) {
            const b1 = spheres[i];
            const b2 = spheres[j];

            const sway1 = getSway(time, b1.id);
            const x1 = b1.cx + sway1.x + b1.displacementX;
            const y1 = b1.cy + sway1.y + b1.displacementY;

            const sway2 = getSway(time, b2.id);
            const x2 = b2.cx + sway2.x + b2.displacementX;
            const y2 = b2.cy + sway2.y + b2.displacementY;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const minDist = b1.r + b2.r + 150; 

            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);

              // Soft, highly cushioned collision separation
              b1.displacementX -= nx * (overlap * 0.25);
              b1.displacementY -= ny * (overlap * 0.25);
              b2.displacementX += nx * (overlap * 0.25);
              b2.displacementY += ny * (overlap * 0.25);
            }
          }
        }
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none w-full h-full transform-gpu"
      style={{
        zIndex: -30,
        backgroundImage: `
          radial-gradient(circle at 1.25px 1.25px, rgba(23, 63, 173, 0.12) 1.25px, transparent 1.25px),
          linear-gradient(to right, rgba(23, 63, 173, 0.025) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(23, 63, 173, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        backgroundPosition: "0px 0px"
      }}
      aria-hidden="true"
    >
      {balls.map((ball) => (
        <div
          key={ball.id}
          ref={(el) => (ballDomRefs.current[ball.id] = el)}
          className="bilc-ambient-glow-orb absolute pointer-events-none rounded-full transform-gpu"
          style={{
            willChange: "transform",
            transform: `translate3d(${ball.cx - ball.r}px, ${ball.cy - ball.r}px, 0)`,
            width: `${ball.r * 2}px`,
            height: `${ball.r * 2}px`,
            minWidth: `${ball.r * 2}px`,
            minHeight: `${ball.r * 2}px`,
            maxWidth: `${ball.r * 2}px`,
            maxHeight: `${ball.r * 2}px`,
            borderRadius: "50%",
            ["--ball-size" as any]: `${ball.r * 2}px`
          }}
        />
      ))}
    </div>
  );
});

export default BackgroundCircleField;
