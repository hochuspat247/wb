"use client";

import { useEffect, useState } from "react";

type Star = {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: string;
  duration: string;
  driftDuration: string;
  opacity: number;
  driftX: number;
  driftY: number;
  variant: "near" | "mid" | "far";
};

type ShootingStar = {
  id: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
};

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, (_, id) => {
    const variant: Star["variant"] = id % 5 === 0 ? "near" : id % 3 === 0 ? "mid" : "far";
    const size = variant === "near" ? 2.4 + (id % 2) : variant === "mid" ? 1.6 + (id % 2) * 0.4 : 1 + (id % 2) * 0.3;

    return {
      id,
      left: `${(id * 37 + 11) % 100}%`,
      top: `${(id * 53 + 7) % 78}%`,
      size,
      delay: `${(id % 13) * 0.35}s`,
      duration: `${2.4 + (id % 6) * 0.55}s`,
      driftDuration: `${14 + (id % 9) * 2.4}s`,
      opacity: variant === "near" ? 0.75 : variant === "mid" ? 0.5 : 0.28 + (id % 4) * 0.08,
      driftX: 12 + ((id * 17) % 28),
      driftY: 8 + ((id * 13) % 22),
      variant
    };
  });
}

function makeShootingStars(count: number): ShootingStar[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    top: `${8 + ((id * 23) % 42)}%`,
    left: `${5 + ((id * 31) % 70)}%`,
    delay: `${id * 4.8 + 1.2}s`,
    duration: `${1.15 + (id % 3) * 0.25}s`
  }));
}

export function StoryFairyAtmosphere() {
  const [stars, setStars] = useState<Star[]>([]);
  const [shooting, setShooting] = useState<ShootingStar[]>([]);

  useEffect(() => {
    setStars(makeStars(72));
    setShooting(makeShootingStars(5));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(80,92,120,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(28,42,36,0.55),_#070b14_70%)]" />
      <div className="absolute inset-0 story-fairy-aurora opacity-70" />
      <div className="absolute inset-0 story-fairy-fog" />

      <div className="story-fairy-sky absolute inset-x-0 top-0 h-[78vh]">
        {stars.map((star) => (
          <span
            key={star.id}
            className={`story-fairy-star story-fairy-star--${star.variant} absolute rounded-full bg-[#f6ecd8]`}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: `${star.delay}, ${star.delay}`,
              animationDuration: `${star.duration}, ${star.driftDuration}`,
              ["--star-x" as string]: `${star.driftX}px`,
              ["--star-y" as string]: `${star.driftY}px`
            }}
          />
        ))}

        {shooting.map((star) => (
          <span
            key={`shoot-${star.id}`}
            className="story-fairy-shoot absolute"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.delay,
              animationDuration: star.duration
            }}
          />
        ))}
      </div>

      <div className="absolute -left-20 top-[18%] h-72 w-72 rounded-full bg-[#c4a574]/15 blur-[100px] animate-float" />
      <div
        className="absolute -right-16 top-[38%] h-80 w-80 rounded-full bg-[#7d9aa3]/12 blur-[110px] animate-float"
        style={{ animationDelay: "1.6s" }}
      />
      <div
        className="absolute bottom-[8%] left-1/3 h-64 w-64 rounded-full bg-[#b48a8f]/10 blur-[90px] animate-float"
        style={{ animationDelay: "0.8s" }}
      />

      <svg
        className="absolute inset-x-0 bottom-0 h-[22vh] w-full text-[#05080f] story-fairy-forest"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
      >
        <path
          fill="currentColor"
          d="M0,160 L80,145 C160,130 240,100 320,108 C400,116 480,160 560,168 C640,176 720,148 800,132 C880,116 960,104 1040,118 C1120,132 1200,172 1280,176 C1360,180 1400,156 1420,144 L1440,132 L1440,220 L0,220 Z"
          opacity="0.55"
        />
        <path
          fill="currentColor"
          d="M0,180 L90,168 C180,156 270,132 360,136 C450,140 540,172 630,178 C720,184 810,164 900,152 C990,140 1080,136 1170,148 C1260,160 1350,184 1395,188 L1440,192 L1440,220 L0,220 Z"
          opacity="0.85"
        />
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_35%,_rgba(5,8,14,0.55)_100%)]" />
    </div>
  );
}
