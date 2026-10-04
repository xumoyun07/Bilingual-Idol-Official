import React, { useEffect, useRef, useState } from "react";

interface BackgroundCircleFieldProps {
  seed?: string;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  side: "left" | "right";
}

export function BackgroundCircleField({ seed = "default-seed" }: BackgroundCircleFieldProps) {
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  // Use refs to store physics state for 60 FPS animation loop
  const ballsRef = useRef<Ball[]>([]);
  const pointerRef = useRef({ x: -1000, y: -1000 });

  // Dimensions state representing full scrollable document width and height
  const [dimensions, setDimensions] = useState({ width: 1200, height: 1000 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Brand-aligned luxury blue color matching the project style (Bilc Blue - #173fad)
  // Designed for elegant, sharp glass bubbles / bubbles with crisp vector outlines
  const sphereColor = {
    center: "rgba(23, 63, 173, 0.18)",  // Soft elegant brand blue center
    middle: "rgba(23, 63, 173, 0.10)",  // Smooth translucent body fill
    outer: "rgba(23, 63, 173, 0.04)",   // Boundary fill
    border: "rgba(23, 63, 173, 0.38)",  // Sharp, precise contour outline matching the brand
  };

  // Boundaries calculation to keep spheres inside the silent side zones
  const getSideBoundaries = (side: "left" | "right", w: number, r: number) => {
    const margin = Math.max(0, (w - 1216) / 2); // 1216px - content grid width
    if (side === "left") {
      const maxVal = margin > 100 ? margin + 120 : w * 0.28;
      return { minX: r, maxX: Math.max(r + 50, maxVal) };
    } else {
      const minVal = margin > 100 ? w - margin - 120 : w * 0.72;
      return { minX: Math.min(w - r - 50, minVal), maxX: w - r };
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

  // 2. Track pointer position in document space for high-fidelity repulsion
  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.pageX, y: e.pageY };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [reducedMotion]);

  // 3. Manage Window Resize and Document Height Resizing
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight,
        1000
      );

      setDimensions({ width, height });

      const dpr = window.devicePixelRatio || 1;
      const resizeCanvas = (canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      };

      resizeCanvas(gridCanvasRef.current);
      resizeCanvas(canvasRef.current);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Check periodically if document height changed due to content loads
    const interval = setInterval(() => {
      const currentDocHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight,
        1000
      );
      if (currentDocHeight !== dimensions.height) {
        handleResize();
      }
    }, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
    };
  }, [dimensions.height]);

  // 4. Initialize Deterministic Spheres Based on Seed
  useEffect(() => {
    const w = dimensions.width;
    const documentHeight = dimensions.height;

    // Seed hashing to number
    let seedHash = 0;
    for (let i = 0; i < seed.length; i++) {
      seedHash = (seedHash << 5) - seedHash + seed.charCodeAt(i);
      seedHash |= 0;
    }
    seedHash = Math.abs(seedHash) || 1;

    let localSeed = seedHash;
    const random = () => {
      const x = Math.sin(localSeed++) * 10000;
      return x - Math.floor(x);
    };

    // Calculate count based on document height
    const count = Math.max(8, Math.floor(documentHeight / 280));
    const list: Ball[] = [];

    for (let i = 0; i < count; i++) {
      const side = random() > 0.5 ? "left" : "right";
      const r = 25 + random() * 75; // Radius: 25px - 100px (Diameter: 50px - 200px)
      const bounds = getSideBoundaries(side, w, r);

      const startX = bounds.minX + random() * (bounds.maxX - bounds.minX);
      const startY = random() * documentHeight;

      // Small initial velocities
      const vx = random() * 0.08 - 0.04;
      const vy = random() * 0.08 - 0.04;

      list.push({
        id: i,
        x: startX,
        y: startY,
        vx,
        vy,
        r,
        side,
      });
    }

    ballsRef.current = list;
  }, [dimensions.width, dimensions.height, seed]);

  // 5. Draw Coordinate Grid (Static Layer - strictly optimized for Single Light Theme)
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;

    ctx.clearRect(0, 0, width, height);

    const gridSpacing = 60;
    const dotRadius = 1.2;

    // Exact required colors for the premium coordinate grid in Light Theme
    const lineColor = "rgba(16, 37, 62, 0.08)";
    const dotColor = "rgba(16, 37, 62, 0.15)";

    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw intersections dots
    for (let x = 0; x < width; x += gridSpacing) {
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.fillStyle = dotColor;
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [dimensions.width, dimensions.height]);

  // Helper method to draw a single premium glossy realistic bubble
  const drawBubble = (ctx: CanvasRenderingContext2D, ball: Ball, opacity: number) => {
    ctx.save();
    ctx.globalAlpha = opacity;

    // 1. Precise outer glass refraction outline (CRISP vector border)
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.strokeStyle = sphereColor.border;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Full background radial gradient for the bubble body
    const gradX = ball.x - ball.r * 0.15;
    const gradY = ball.y - ball.r * 0.15;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);

    const bodyGradient = ctx.createRadialGradient(
      gradX,
      gradY,
      ball.r * 0.05,
      ball.x,
      ball.y,
      ball.r
    );

    bodyGradient.addColorStop(0, sphereColor.center);
    bodyGradient.addColorStop(0.3, sphereColor.center);
    bodyGradient.addColorStop(0.7, sphereColor.middle);
    bodyGradient.addColorStop(0.92, sphereColor.outer);
    bodyGradient.addColorStop(1.0, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = bodyGradient;
    ctx.fill();

    // 3. Specular highlight curve on the top-left to simulate light reflecting on a glossy bubble sphere
    ctx.beginPath();
    const hRadius = ball.r * 0.18;
    const hX = ball.x - ball.r * 0.35;
    const hY = ball.y - ball.r * 0.35;
    ctx.arc(hX, hY, hRadius, 0, Math.PI * 2);

    const highlightGrad = ctx.createRadialGradient(
      hX,
      hY,
      0,
      hX,
      hY,
      hRadius
    );
    highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
    highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlightGrad;
    ctx.fill();

    // 4. Soft secondary ambient reflection on the bottom-right for realistic depth
    ctx.beginPath();
    const bRadius = ball.r * 0.14;
    const bX = ball.x + ball.r * 0.32;
    const bY = ball.y + ball.r * 0.32;
    ctx.arc(bX, bY, bRadius, 0, Math.PI * 2);

    const bottomGrad = ctx.createRadialGradient(
      bX,
      bY,
      0,
      bX,
      bY,
      bRadius
    );
    bottomGrad.addColorStop(0, "rgba(23, 63, 173, 0.22)");
    bottomGrad.addColorStop(1, "rgba(23, 63, 173, 0)");
    ctx.fillStyle = bottomGrad;
    ctx.fill();

    ctx.restore();
  };

  // 6. Physics Animation Loop for Dynamic Spheres
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;

    // Clear and draw once if user prefers reduced motion (zero-CPU active drawing)
    if (reducedMotion) {
      ctx.clearRect(0, 0, width, height);
      const spheres = ballsRef.current;
      spheres.forEach((ball) => {
        drawBubble(ctx, ball, 1.0);
      });
      return;
    }

    const tick = (time: number) => {
      const activeCanvas = canvasRef.current;
      if (!activeCanvas) {
        requestRef.current = requestAnimationFrame(tick);
        return;
      }
      const activeCtx = activeCanvas.getContext("2d");
      if (!activeCtx) {
        requestRef.current = requestAnimationFrame(tick);
        return;
      }

      const w = dimensions.width;
      const h = dimensions.height;

      activeCtx.clearRect(0, 0, w, h);

      const spheres = ballsRef.current;
      const pointer = pointerRef.current;

      // Phase A: Apply Physics, Fluid Micro-drift, Cursor Repulsion, and Side Boundaries Bounce
      spheres.forEach((ball) => {
        // Fluid Viscosity: slower, highly premium damping so drift feels majestic and calm
        ball.vx *= 0.992;
        ball.vy *= 0.992;

        // Fluid Micro-drift (ultra-languid oscillations)
        ball.vx += Math.sin(time * 0.0008 + ball.id) * 0.00008;
        ball.vy += Math.cos(time * 0.0008 + ball.id) * 0.00008;

        // Gentle, extremely subtle Pointer/Cursor repulsion
        const dx = ball.x - pointer.x;
        const dy = ball.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxInfluence = 260; // 260px hover influence zone

        if (dist < maxInfluence) {
          const force = (1 - dist / maxInfluence) * 0.015; // Extremely gentle and luxurious push force
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          ball.vx += nx * force;
          ball.vy += ny * force;
        }

        // Limit maximum speed strictly to 0.08 px/frame for a truly slow, premium movement
        const maxSpeed = 0.08;
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > maxSpeed) {
          ball.vx = (ball.vx / currentSpeed) * maxSpeed;
          ball.vy = (ball.vy / currentSpeed) * maxSpeed;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce gently inside side boundary silent zones (protecting central 1216px area)
        const bounds = getSideBoundaries(ball.side, w, ball.r);
        if (ball.side === "left") {
          if (ball.x - ball.r < bounds.minX - 100) {
            ball.x = bounds.minX - 100 + ball.r;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x + ball.r > bounds.maxX) {
            ball.x = bounds.maxX - ball.r;
            ball.vx = -Math.abs(ball.vx);
          }
        } else {
          if (ball.x - ball.r < bounds.minX) {
            ball.x = bounds.minX + ball.r;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x + ball.r > bounds.maxX + 100) {
            ball.x = bounds.maxX + 100 - ball.r;
            ball.vx = -Math.abs(ball.vx);
          }
        }

        // Bounce gently off top/bottom page height
        if (ball.y - ball.r < -100) {
          ball.y = -100 + ball.r;
          ball.vy = Math.abs(ball.vy);
        } else if (ball.y + ball.r > h + 100) {
          ball.y = h + 100 - ball.r;
          ball.vy = -Math.abs(ball.vy);
        }
      });

      // Phase B: Collision Separation (Multi-pass Relaxation Loop with 80px buffer)
      const passes = 2;
      for (let p = 0; p < passes; p++) {
        for (let i = 0; i < spheres.length; i++) {
          for (let j = i + 1; j < spheres.length; j++) {
            const b1 = spheres[i];
            const b2 = spheres[j];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.r + b2.r + 80; // Sum of radii + 80px buffer gap

            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);

              // Softly repel balls in opposite directions
              b1.x -= nx * (overlap * 0.5);
              b1.y -= ny * (overlap * 0.5);
              b2.x += nx * (overlap * 0.5);
              b2.y += ny * (overlap * 0.5);
            }
          }
        }
      }

      // Phase C: Render realistic glossy bubbles with specular reflections and clear vector contours
      spheres.forEach((ball) => {
        // Soft fading at top/bottom of page (Fade Zones)
        let finalOpacity = 1;
        const fadeZone = 120; // 120px fade out zone from edges
        if (ball.y < fadeZone) {
          finalOpacity = Math.max(0.1, ball.y / fadeZone);
        } else if (ball.y > h - fadeZone) {
          finalOpacity = Math.max(0.1, (h - ball.y) / fadeZone);
        }

        drawBubble(activeCtx, ball, finalOpacity);
      });

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [dimensions.width, dimensions.height, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none w-full h-full"
      style={{ zIndex: -30 }}
      aria-hidden="true"
    >
      {/* Слой 1: Статичная сетка координат (перерисовывается только при ресайзе экрана) */}
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ zIndex: -20 }}
      />

      {/* Слой 2: Динамические сферы (высокопроизводительные реалистичные стеклянные пузыри с точным контуром) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ zIndex: -10 }}
      />
    </div>
  );
}

export default BackgroundCircleField;
