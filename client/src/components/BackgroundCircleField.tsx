import React, { useMemo } from "react";

interface BackgroundCircleFieldProps {
  seed?: string;
}

interface CircleConfig {
  id: number;
  width: string;
  height: string;
  left: string;
  top: string;
  color: string;
  opacity: string;
  blur: string;
}

export function BackgroundCircleField({ seed = "default-seed" }: BackgroundCircleFieldProps) {
  const circles = useMemo(() => {
    // A simple, reliable hash function to generate deterministic values from seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const getPseudoRandom = (index: number, min: number, max: number) => {
      const val = Math.abs(Math.sin(hash + index) * 1000);
      return min + (val % (max - min));
    };

    const colors = [
      "bg-blue-200 dark:bg-blue-900/20",
      "bg-sky-200 dark:bg-sky-900/20",
      "bg-indigo-200 dark:bg-indigo-900/20",
      "bg-slate-200 dark:bg-slate-800/20",
      "bg-amber-100 dark:bg-amber-900/10",
    ];

    const configs: CircleConfig[] = [];
    const count = 4; // Generate 4 abstract circles

    for (let i = 0; i < count; i++) {
      const size = getPseudoRandom(i * 10, 150, 400);
      const top = getPseudoRandom(i * 20 + 1, -10, 110);
      const left = getPseudoRandom(i * 30 + 2, -10, 110);
      const colorIndex = Math.floor(getPseudoRandom(i * 40 + 3, 0, colors.length));
      const opacity = (getPseudoRandom(i * 50 + 4, 3, 8) / 100).toFixed(2); // 3% to 8% opacity for subtlety
      const blurVal = Math.floor(getPseudoRandom(i * 60 + 5, 40, 100));

      configs.push({
        id: i,
        width: `${size}px`,
        height: `${size}px`,
        left: `${left}%`,
        top: `${top}%`,
        color: colors[colorIndex] || colors[0]!,
        opacity,
        blur: `blur(${blurVal}px)`,
      });
    }

    return configs;
  }, [seed]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {circles.map((circle) => (
        <div
          key={circle.id}
          className={`absolute rounded-full transition-all duration-1000 ease-in-out ${circle.color}`}
          style={{
            width: circle.width,
            height: circle.height,
            left: circle.left,
            top: circle.top,
            opacity: circle.opacity,
            filter: circle.blur,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

export default BackgroundCircleField;
