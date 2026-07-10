"use client";

import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { KVARTOVID_VIDEO_DEMO } from "@/lib/kvartovid/videoExample";

export function KvartovidVideoDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <div className="mx-auto w-full max-w-[220px] sm:max-w-[240px] lg:mx-0 lg:max-w-[260px]">
      <div className="overflow-hidden rounded-[24px] border border-amber-500/30 bg-black shadow-[0_24px_80px_rgba(245,158,11,0.2)]">
        <div className="relative aspect-[9/16] w-full bg-[#0a1210]">
          <video
            ref={videoRef}
            autoPlay
            className="h-full w-full object-cover"
            loop
            muted={muted}
            playsInline
            preload="metadata"
            src={KVARTOVID_VIDEO_DEMO.src}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {KVARTOVID_VIDEO_DEMO.badge}
              </span>
              <span className="text-[10px] font-medium text-white/70">{KVARTOVID_VIDEO_DEMO.durationLabel}</span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-sm font-semibold text-white">{KVARTOVID_VIDEO_DEMO.title}</p>
            <p className="mt-1 text-xs text-white/70">{KVARTOVID_VIDEO_DEMO.kicker}</p>
          </div>

          <div className="absolute bottom-12 right-3 flex flex-col gap-2">
            <button
              type="button"
              aria-label={playing ? "Пауза" : "Воспроизвести"}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
              onClick={togglePlay}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
              onClick={toggleMute}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted lg:text-left">
        Реальный пример видео-тура из фото квартиры
      </p>
    </div>
  );
}
