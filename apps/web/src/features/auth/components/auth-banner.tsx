"use client";

import { motion } from "motion/react";
import { Logo } from "@/assets/logo";
import { useTranslations } from "next-intl";

type SpiralLayerProps = {
  gradientId: string;
  colorVar: "var(--primary)" | "var(--accent-foreground)";
  opacity?: number;
  cycleDuration?: number;
  phase?: number;
  blur?: number;
};

function SpiralLayer({
  gradientId,
  colorVar,
  opacity = 1,
  cycleDuration = 24,
  phase = 0,
  blur = 0,
}: SpiralLayerProps) {
  const cx = 348;
  const cy = 158;
  const lineCount = 6;

  const spiralRadii = [180, 160, 140, 122, 106, 92, 79, 68, 58, 49, 41, 34, 28, 22, 17, 13, 10];

  const spiralArcs = spiralRadii
    .map((r, j) => `a${r},${r} 0 1,1 ${j % 2 === 0 ? r * 2 : -(r * 2)},0`)
    .join(" ");

  const spiralStartX = cx - spiralRadii[0];

  let spiralEndX = spiralStartX;
  for (let j = 0; j < spiralRadii.length; j++) {
    spiralEndX += j % 2 === 0 ? spiralRadii[j] * 2 : -(spiralRadii[j] * 2);
  }

  const paths = Array.from({ length: lineCount }, (_, i) => {
    const t = (i - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
    const spread = 140 * t;
    const yOffset = spread * 0.08;

    const d = [
      `M-300,${(cy + spread).toFixed(1)}`,
      `C${(60).toFixed(1)},${(cy + spread * 0.88).toFixed(1)}`,
      ` ${(spiralStartX - 100).toFixed(1)},${(cy + yOffset * 3).toFixed(1)}`,
      ` ${spiralStartX},${(cy + yOffset).toFixed(1)}`,
      spiralArcs,
      `C${(spiralEndX + 100).toFixed(1)},${(cy + yOffset * 3).toFixed(1)}`,
      ` ${(640).toFixed(1)},${(cy + spread * 0.88).toFixed(1)}`,
      ` 1000,${(cy + spread).toFixed(1)}`,
    ].join(" ");

    return {
      id: i,
      d,
      width: 0.9 + Math.abs(t) * 0.9,
    };
  });

  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 696 316"
      fill="none"
      style={{
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colorVar} stopOpacity="0.9" />
          <stop offset="35%" stopColor={colorVar} stopOpacity="0.6" />
          <stop offset="70%" stopColor={colorVar} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colorVar} stopOpacity="0.04" />
        </radialGradient>
      </defs>

      {paths.map((path) => (
        <motion.path
          key={`${gradientId}-${path.id}`}
          d={path.d}
          stroke={`url(#${gradientId})`}
          strokeWidth={path.width}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 0.18,
            opacity: [0, 0.5, 0.6, 0.5, 0],
            pathOffset: [0, 1],
          }}
          transition={{
            duration: cycleDuration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
            delay: ((path.id / lineCount) * cycleDuration + phase * cycleDuration) % cycleDuration,
          }}
        />
      ))}
    </svg>
  );
}

function Spiral() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0">
        <SpiralLayer
          gradientId="spiralGradPrimary"
          colorVar="var(--primary)"
          cycleDuration={24}
          phase={0}
          blur={0}
          opacity={1}
        />
      </div>

      <div className="absolute inset-0">
        <SpiralLayer
          gradientId="spiralGradAccent"
          colorVar="var(--accent-foreground)"
          cycleDuration={20}
          phase={0.35}
          blur={0.6}
          opacity={0.9}
        />
      </div>
    </div>
  );
}

function Particles() {
  const count = 18;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const left = 8 + (i * 92) / (count - 1);
        const top = 18 + ((i * 73) % 60);
        const size = 4 + (i % 3) * 0.6;
        const duration = 3.2 + (i % 6) * 0.55;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/45 dark:bg-primary/25"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              filter: "blur(0.2px)",
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.15, 0.45, 0.15],
            }}
            transition={{
              duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: (i % 9) * 0.18,
            }}
          />
        );
      })}
    </div>
  );
}

export function AuthBanner() {
  const t = useTranslations();

  return (
    <div className="relative flex flex-col items-center justify-between h-full w-full px-8 py-10 overflow-hidden bg-background dark:bg-card">
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, transparent 40%,rgba(194, 65, 12, 0.1) 100%)",
        }}
      />

      <div className="absolute inset-0">
        <Spiral />
        <Particles />
      </div>

      <motion.div
        className="relative z-10 flex items-center gap-3 w-full justify-start"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo />
        <span className="text-xl font-bold tracking-tight text-foreground font-display">
          Spiral
        </span>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        className="relative z-10 text-center max-w-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <blockquote className="space-y-3">
          <p className="text-base leading-relaxed text-muted-foreground italic">
            {t("auth.sign-in.banner-quote")}
          </p>
          <footer className="text-sm text-muted-foreground/60 tracking-wider uppercase">
            Vladimir Nabokov
          </footer>
        </blockquote>
      </motion.div>
    </div>
  );
}
