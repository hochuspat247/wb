import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PRODUCT_CARD_VIDEO_DEMO } from "@/lib/marketing/videoExample";

export function VideoExampleSection() {
  return (
    <section className="border-t border-clay bg-card py-20 md:py-28" id="video-example">
      <div className="section-shell">
        <SectionHeader
          description={PRODUCT_CARD_VIDEO_DEMO.description}
          title={PRODUCT_CARD_VIDEO_DEMO.title}
        />

        <Reveal delay={1}>
          <div className="mx-auto mt-10 max-w-[320px] sm:max-w-[360px]">
            <div className="overflow-hidden rounded-[24px] border border-clay bg-paper/40 p-2 shadow-soft">
              <div className="relative overflow-hidden rounded-[18px] border border-clay bg-black">
                <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wide text-paper">
                  {PRODUCT_CARD_VIDEO_DEMO.badge}
                </span>
                <video
                  autoPlay
                  className="aspect-[4/5] w-full object-cover"
                  controls
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={PRODUCT_CARD_VIDEO_DEMO.src}
                />
              </div>
              <p className="mt-3 px-1 text-center text-xs font-semibold text-muted">{PRODUCT_CARD_VIDEO_DEMO.durationLabel}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
