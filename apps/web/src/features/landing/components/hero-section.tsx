"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("Landing.HeroSection");
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  return (
    <section ref={ref} id="hero" className="relative min-h-screen overflow-hidden bg-background">
      <motion.div className="absolute inset-0 overflow-hidden" style={{ y, opacity }}>
        <motion.div
          className="absolute top-[53%] left-1/2 h-225 w-225 -translate-x-1/2 -translate-y-1/2 transform-gpu"
          style={{
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <svg
            viewBox="0 0 800 800"
            className="h-full w-full opacity-20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id="spiralGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
                <stop offset="30%" stopColor="var(--primary)" stopOpacity="0.6" />
                <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M400,400 m-350,0 a350,350 0 1,1 700,0 a300,300 0 1,1 -600,0 a250,250 0 1,1 500,0 a200,200 0 1,1 -400,0 a150,150 0 1,1 300,0 a100,100 0 1,1 -200,0 a50,50 0 1,1 100,0"
              stroke="url(#spiralGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-1/2 h-175 w-175 -translate-x-1/2 -translate-y-1/2 transform-gpu"
          style={{
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <svg
            viewBox="0 0 600 600"
            className="h-full w-full opacity-15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <radialGradient id="spiralGradient2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent-foreground)" stopOpacity="0" />
                <stop offset="40%" stopColor="var(--accent-foreground)" stopOpacity="0.4" />
                <stop offset="80%" stopColor="var(--accent-foreground)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--accent-foreground)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M300,300 m-250,0 a250,250 0 1,0 500,0 a200,200 0 1,0 -400,0 a150,150 0 1,0 300,0 a100,100 0 1,0 -200,0 a50,50 0 1,0 100,0"
              stroke="url(#spiralGradient2)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </motion.div>

        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary/30"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-32 pb-16"
        style={{ scale }}
      >
        <div className="mx-auto max-w-5xl space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="text-balance font-bold text-5xl leading-none tracking-tight md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {t("title").split("\n")[0]}
              <br />
              <span className="bg-linear-to-r from-primary via-primary to-accent-foreground bg-clip-text text-transparent antialiased">
                {t("title").split("\n")[1]}
              </span>
            </motion.h1>
          </motion.div>

          <motion.p
            className="mx-auto max-w-3xl text-pretty text-lg text-muted-foreground leading-relaxed md:text-xl lg:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button size="lg" className="group" disabled>
              {t("ctaDisabled")}
            </Button>
          </motion.div>

          <motion.p
            className="pt-8 font-mono text-muted-foreground text-sm uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {t("kicker")}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
