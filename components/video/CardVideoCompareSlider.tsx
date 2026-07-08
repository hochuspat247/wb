"use client";

import Image, { type StaticImageData } from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type CardVideoCompareSliderProps = {
  cardImage: StaticImageData;
  videoSrc: string;
  alt: string;
  label?: string;
  duration?: string;
  badge?: string;
  sizes?: string;
};

export function CardVideoCompareSlider({
  cardImage,
  videoSrc,
  alt,
  label,
  duration,
  badge,
  sizes = "(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 100vw"
}: CardVideoCompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(42);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(98, Math.max(2, next)));
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (event: PointerEvent) => updatePosition(event.clientX);
    const onUp = () => setIsDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <div className="overflow-hidden rounded-card border border-clay bg-card shadow-soft transition duration-300 hover:-translate-y-1 hover:border-white/15">
      <div
        className="relative aspect-[4/5] cursor-ew-resize touch-pan-y select-none"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-handle]")) return;
          setIsDragging(true);
          updatePosition(event.clientX);
        }}
        ref={containerRef}
      >
        <video
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
          src={videoSrc}
        />

        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image
            alt={`${alt} — карточка`}
            className="object-cover"
            fill
            placeholder="blur"
            sizes={sizes}
            src={cardImage}
          />
        </div>

        {badge ? (
          <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wide text-paper">
            {badge}
          </span>
        ) : null}

        <span className="pointer-events-none absolute left-3 top-12 z-20 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-paper shadow-sm">
          Карточка
        </span>
        <span className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-paper shadow-sm">
          Видео
        </span>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
          style={{ left: `${position}%` }}
        />

        <button
          aria-label="Сравнить карточку и видео"
          className="absolute top-1/2 z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white text-paper shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 active:scale-95"
          data-handle
          onPointerDown={(event) => {
            event.stopPropagation();
            setIsDragging(true);
            updatePosition(event.clientX);
          }}
          style={{ left: `${position}%` }}
          type="button"
        >
          <span className="flex items-center">
            <ChevronLeft className="-mr-1.5 h-3.5 w-3.5 text-muted" />
            <ChevronRight className="-ml-1.5 h-3.5 w-3.5 text-muted" />
          </span>
        </button>
      </div>

      {label || duration ? (
        <div className="flex items-center justify-between gap-3 border-t border-clay px-4 py-3">
          {label ? <p className="text-sm font-semibold text-ink">{label}</p> : <span />}
          {duration ? <p className="text-sm font-semibold text-muted">{duration}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
