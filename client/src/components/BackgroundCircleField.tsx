import React, { useEffect, useRef, useMemo } from "react";

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
  color1: string;
  color2: string;
  borderColor: string;
  opacity: number;
  side: "left" | "right";
}

export function BackgroundCircleField({ seed = "default-seed" }: BackgroundCircleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const scrollYRef = useRef<number>(window.scrollY);
  const animationFrameId = useRef<number | null>(null);

  // Use seed to generate semi-deterministic pseudo-random sequence
  const seedHash = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [seed]);

  useEffect(() => {
    const container = containerRef.current;
    const gridCanvas = gridCanvasRef.current;
    const canvas = canvasRef.current;
    if (!container || !gridCanvas || !canvas) return;

    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 600;

    gridCanvas.width = width;
    gridCanvas.height = height;
    canvas.width = width;
    canvas.height = height;

    // Helper to generate a pseudo-random number based on local state
    let localSeed = seedHash;
    const random = () => {
      const x = Math.sin(localSeed++) * 10000;
      return x - Math.floor(x);
    };

    // Premium high-tech and elegant Blue-only color palettes
    const bluePalettes = [
      {
        color1: "rgba(147, 197, 253, 0.22)", // soft sky blue
        color2: "rgba(59, 130, 246, 0.05)",
        borderColor: "rgba(59, 130, 246, 0.16)",
      },
      {
        color1: "rgba(165, 180, 252, 0.20)", // deep indigo blue
        color2: "rgba(99, 102, 241, 0.04)",
        borderColor: "rgba(99, 102, 241, 0.14)",
      },
      {
        color1: "rgba(191, 219, 254, 0.24)", // vibrant light blue
        color2: "rgba(37, 99, 235, 0.05)",
        borderColor: "rgba(37, 99, 235, 0.16)",
      },
      {
        color1: "rgba(14, 165, 233, 0.18)", // cyan blue
        color2: "rgba(2, 132, 199, 0.03)",
        borderColor: "rgba(2, 132, 199, 0.12)",
      },
      {
        color1: "rgba(30, 58, 138, 0.15)", // royal navy blue
        color2: "rgba(23, 37, 84, 0.02)",
        borderColor: "rgba(29, 78, 216, 0.14)",
      }
    ];

    // Check function to verify that the physical gap (distance between circle boundaries) is at least 100px
    const isFarEnough = (newBall: Partial<Ball>, currentBalls: Ball[], minGap = 100): boolean => {
      for (const other of currentBalls) {
        if (other.id === newBall.id) continue;
        const dx = (newBall.x ?? 0) - other.x;
        const dy = (newBall.y ?? 0) - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Distance between boundaries must be >= minGap (100px)
        if (dist < ((newBall.r ?? 0) + other.r + minGap)) {
          return false;
        }
      }
      return true;
    };

    const getSideBoundaries = (side: "left" | "right", w: number, r: number) => {
      const margin = Math.max(0, (w - 1216) / 2);
      if (side === "left") {
        const maxVal = margin > 100 ? margin + 120 : w * 0.28;
        return { minX: r, maxX: Math.max(r + 50, maxVal) };
      } else {
        const minVal = margin > 100 ? w - margin - 120 : w * 0.72;
        return { minX: Math.min(w - r - 50, minVal), maxX: w - r };
      }
    };

    // Initialize spheres evenly distributed across the entire document height
    const initBalls = (w: number, h: number) => {
      // Dynamic count based on page height to ensure even distribution throughout the scrollable area
      const count = Math.max(8, Math.floor(h / 280));
      const list: Ball[] = [];

      for (let i = 0; i < count; i++) {
        let attempts = 0;
        let r = 25 + Math.floor(random() * 75); // Radius is 25-100px (Diameter 50-200px)
        let x = 0;
        let y = 0;
        let valid = false;
        const side: "left" | "right" = (i % 2 === 0) ? "left" : "right";
        const { minX, maxX } = getSideBoundaries(side, w, r);

        while (!valid && attempts < 100) {
          // Evenly segment along the entire length of the page with random variation
          const relativeSegmentY = (i + 0.5) / count;
          const rx = side === "left" ? 0.05 + random() * 0.2 : 0.75 + random() * 0.2;

          x = minX + rx * (maxX - minX);
          y = r + relativeSegmentY * (h - r * 2) + (random() - 0.5) * 80;
          x = Math.max(minX, Math.min(maxX, x));
          y = Math.max(r, Math.min(h - r, y));

          const tempBall = { id: i, x, y, r, side };
          if (isFarEnough(tempBall as Ball, list, 80)) {
            valid = true;
          }
          attempts++;
        }

        const palette = bluePalettes[Math.floor(random() * bluePalettes.length)]!;
        const angle = random() * Math.PI * 2;
        const speed = 0.08 + random() * 0.12; // Extremely gentle slow drift for elegant feel

        list.push({
          id: i,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r,
          color1: palette.color1,
          color2: palette.color2,
          borderColor: palette.borderColor,
          opacity: 1,
          side
        });
      }

      ballsRef.current = list;
    };

    initBalls(width, height);

    // ResizeObserver to handle canvas resizing dynamically without resetting or jumping positions
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0]!;
      const newWidth = Math.floor(entry.contentRect.width);
      const newHeight = Math.floor(entry.contentRect.height);

      if (newWidth === 0 || newHeight === 0) return;

      gridCanvas.width = newWidth;
      gridCanvas.height = newHeight;
      canvas.width = newWidth;
      canvas.height = newHeight;
      width = newWidth;
      height = newHeight;

      const balls = ballsRef.current;
      for (const ball of balls) {
        const { minX, maxX } = getSideBoundaries(ball.side, newWidth, ball.r);
        ball.x = Math.max(minX, Math.min(maxX, ball.x));
        ball.y = Math.max(ball.r, Math.min(newHeight - ball.r, ball.y));
      }
      drawGrid();
    });

    resizeObserver.observe(container);

    // Optimized grid background drawing function
    const drawGrid = () => {
      const gCtx = gridCanvas.getContext("2d");
      if (!gCtx) return;

      gCtx.clearRect(0, 0, width, height);

      const cellSize = 60;
      const isDarkMode = document.documentElement.classList.contains("dark") || document.body.classList.contains("dark");
      
      const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(16, 37, 62, 0.08)";
      const dotColor = isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(16, 37, 62, 0.15)";

      gCtx.strokeStyle = gridColor;
      gCtx.lineWidth = 1;

      for (let x = 0; x < width; x += cellSize) {
        gCtx.beginPath();
        gCtx.moveTo(x, 0);
        gCtx.lineTo(x, height);
        gCtx.stroke();
      }

      for (let y = 0; y < height; y += cellSize) {
        gCtx.beginPath();
        gCtx.moveTo(0, y);
        gCtx.lineTo(width, y);
        gCtx.stroke();
      }

      gCtx.fillStyle = dotColor;
      for (let x = 0; x < width; x += cellSize) {
        for (let y = 0; y < height; y += cellSize) {
          gCtx.beginPath();
          gCtx.arc(x, y, 1.2, 0, Math.PI * 2);
          gCtx.fill();
        }
      }
    };

    drawGrid();

    // Unified Animation Loop
    const animate = (time: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      const balls = ballsRef.current;

      // Phase 1: Update each ball's physical position & bounds bounce (NO SCROLL INTERFERENCE)
      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i]!;

        // Subtle waves to guarantee organic micro-movement
        ball.vx += Math.sin(time * 0.001 + ball.id) * 0.0005;
        ball.vy += Math.cos(time * 0.001 + ball.id) * 0.0005;

        // Cap speed to extremely gentle, premium drifting rates
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const maxSpeed = 0.22; 
        if (speed > maxSpeed) {
          ball.vx = (ball.vx / speed) * maxSpeed;
          ball.vy = (ball.vy / speed) * maxSpeed;
        }

        // Apply gentle autonomous drift movement
        ball.x += ball.vx;
        ball.y += ball.vy;

        const { minX, maxX } = getSideBoundaries(ball.side, width, ball.r);

        // Bounce horizontally if hitting side bounds
        if (ball.x <= minX && ball.vx < 0) {
          ball.vx = Math.abs(ball.vx);
        } else if (ball.x >= maxX && ball.vx > 0) {
          ball.vx = -Math.abs(ball.vx);
        }

        // Bounce vertically off top/bottom borders of full page height to maintain exact count and positions
        if (ball.y <= ball.r && ball.vy < 0) {
          ball.vy = Math.abs(ball.vy);
        } else if (ball.y >= height - ball.r && ball.vy > 0) {
          ball.vy = -Math.abs(ball.vy);
        }

        // Hard clamping to strictly avoid leaving boundaries
        ball.x = Math.max(minX, Math.min(maxX, ball.x));
        ball.y = Math.max(ball.r, Math.min(height - ball.r, ball.y));
      }

      // Phase 2: Multi-pass relaxation loop to resolve inter-sphere clumping
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i]!;
            const b2 = balls[j]!;
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.r + b2.r + 80;

            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / (dist || 1);
              const ny = dy / (dist || 1);

              b1.x -= nx * (overlap * 0.5);
              b1.y -= ny * (overlap * 0.5);
              b2.x += nx * (overlap * 0.5);
              b2.y += ny * (overlap * 0.5);

              const rvx = b2.vx - b1.vx;
              const rvy = b2.vy - b1.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const impulse = -2 * velAlongNormal;
                b1.vx -= (impulse * 0.5) * nx;
                b1.vy -= (impulse * 0.5) * ny;
                b2.vx += (impulse * 0.5) * nx;
                b2.vy += (impulse * 0.5) * ny;
              }
            }
          }
        }
      }

      // Phase 3: Draw spheres at exact absolute layout coordinates
      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i]!;

        // Gentle visual opacity fade zones at extreme top & bottom boundaries of document
        let finalOpacity = 1;
        const fadeZone = 120;
        if (ball.y < fadeZone) {
          finalOpacity = Math.max(0.1, ball.y / fadeZone);
        } else if (ball.y > height - fadeZone) {
          finalOpacity = Math.max(0.1, (height - ball.y) / fadeZone);
        }

        ctx.save();
        ctx.globalAlpha = finalOpacity;
        ctx.beginPath();
        const grad = ctx.createRadialGradient(
          ball.x - ball.r * 0.15,
          ball.y - ball.r * 0.15,
          ball.r * 0.05,
          ball.x,
          ball.y,
          ball.r
        );
        grad.addColorStop(0, ball.color1);
        grad.addColorStop(1, ball.color2);

        ctx.fillStyle = grad;
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = ball.borderColor;
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [seedHash]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none w-full h-full"
      style={{ zIndex: -30 }}
    >
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ zIndex: -20, pointerEvents: "none" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ zIndex: -10, pointerEvents: "none" }}
      />
    </div>
  );
}

export default BackgroundCircleField;
