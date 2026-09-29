import React, { useMemo } from "react";

interface BackgroundCircleFieldProps {
  seed?: string;
}

interface FloatingBall {
  id: string;
  size: number;
  top: string;
  left?: string;
  right?: string;
  gradient: string;
  blur: number;
  duration: string;
  delay: string;
  animType: 1 | 2 | 3;
}

/**
 * Authentic BILC Grid & Floating Decorative Balls Background
 * Features the signature geometric dot-matrix grid with smooth drifting motion
 * and elegant, translucent floating ambient balls/orbs in official brand hues.
 */
export function BackgroundCircleField({ seed = "default" }: BackgroundCircleFieldProps) {
  // Deterministic seed offset for subtle variance between dashboards and pages
  const offset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 10) - 5; // -5 to +5
  }, [seed]);

  const balls: FloatingBall[] = useMemo(() => [
    {
      id: "ball-royal-blue",
      size: 320,
      top: `${Math.max(2, 6 + offset)}%`,
      right: `${Math.max(2, 5 - offset)}%`,
      gradient: "radial-gradient(circle at 40% 40%, rgba(23, 63, 173, 0.22) 0%, rgba(23, 63, 173, 0.08) 50%, rgba(23, 63, 173, 0) 75%)",
      blur: 24,
      duration: "20s",
      delay: "0s",
      animType: 1,
    },
    {
      id: "ball-warm-gold",
      size: 270,
      top: `${Math.max(12, 32 + offset)}%`,
      left: `${Math.max(2, 4 + offset)}%`,
      gradient: "radial-gradient(circle at 45% 45%, rgba(223, 209, 191, 0.45) 0%, rgba(197, 160, 110, 0.18) 50%, rgba(197, 160, 110, 0) 75%)",
      blur: 20,
      duration: "24s",
      delay: "-7s",
      animType: 2,
    },
    {
      id: "ball-sky-azure",
      size: 240,
      top: `${Math.max(45, 65 - offset)}%`,
      right: `${Math.max(4, 12 + offset)}%`,
      gradient: "radial-gradient(circle at 40% 40%, rgba(56, 189, 248, 0.24) 0%, rgba(37, 99, 235, 0.08) 55%, rgba(37, 99, 235, 0) 75%)",
      blur: 18,
      duration: "22s",
      delay: "-12s",
      animType: 3,
    },
    {
      id: "ball-sapphire-soft",
      size: 190,
      top: `${Math.max(5, 14 - offset)}%`,
      left: `${Math.max(5, 14 - offset)}%`,
      gradient: "radial-gradient(circle at 35% 35%, rgba(37, 99, 235, 0.2) 0%, rgba(23, 63, 173, 0.06) 55%, transparent 75%)",
      blur: 16,
      duration: "18s",
      delay: "-4s",
      animType: 1,
    },
    {
      id: "ball-amber-glow",
      size: 150,
      top: `${Math.max(25, 52 + offset)}%`,
      right: `${Math.max(10, 24 + offset)}%`,
      gradient: "radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.05) 50%, transparent 75%)",
      blur: 14,
      duration: "16s",
      delay: "-9s",
      animType: 2,
    },
    {
      id: "ball-opal-mini",
      size: 120,
      top: `${Math.max(60, 78 + offset)}%`,
      left: `${Math.max(6, 18 + offset)}%`,
      gradient: "radial-gradient(circle at 45% 45%, rgba(147, 197, 253, 0.25) 0%, rgba(59, 130, 246, 0.06) 55%, transparent 75%)",
      blur: 12,
      duration: "21s",
      delay: "-15s",
      animType: 3,
    },
  ], [offset]);

  return (
    <div
      className="bilc-background-field absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Floating Keyframes for organic, gentle ambient floating */}
      <style>{`
        @keyframes bilc-drift-ball-1 {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(24px, -32px, 0) scale(1.04);
          }
          66% {
            transform: translate3d(-18px, 20px, 0) scale(0.96);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes bilc-drift-ball-2 {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(-26px, 28px, 0) scale(0.95);
          }
          66% {
            transform: translate3d(20px, -22px, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes bilc-drift-ball-3 {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          40% {
            transform: translate3d(20px, 26px, 0) scale(1.03);
          }
          75% {
            transform: translate3d(-22px, -24px, 0) scale(0.97);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes bilc-field-grid-drift {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 32px 32px;
          }
        }
      `}</style>

      {/* 1. Classic BILC Geometric Dot-Grid Layer (сетчатый фон) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(23, 63, 173, 0.055) 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
          animation: "bilc-field-grid-drift 20s linear infinite",
          opacity: 0.9,
        }}
      />

      {/* 2. Floating Ambient Balls / Orbs (плавающие шары) */}
      {balls.map((ball) => (
        <div
          key={ball.id}
          className="absolute rounded-full pointer-events-none will-change-transform"
          style={{
            width: `${ball.size}px`,
            height: `${ball.size}px`,
            top: ball.top,
            left: ball.left,
            right: ball.right,
            background: ball.gradient,
            filter: `blur(${ball.blur}px)`,
            animation: `bilc-drift-ball-${ball.animType} ${ball.duration} ease-in-out ${ball.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default BackgroundCircleField;
