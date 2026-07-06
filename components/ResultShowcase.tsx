import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AfterCardMock, BeforePhotoMock } from "@/components/marketing/ProductMocks";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ResultShowcase() {
  return (
    <section className="dark-section-inner py-20 md:py-28">
      <div className="section-shell">
        <SectionHeader
          description="Загрузите фото — AI соберёт премиальную карточку с инфографикой, характеристиками и обложкой 4:5."
          kicker="Результат"
          theme="dark"
          title={
            <>
              Фото товара <span className="text-white/40">→</span>{" "}
              <span className="gradient-text-light">готовая карточка</span>
            </>
          }
        />

        <Reveal delay={1}>
          <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
            <div className="showcase-card">
              <span className="showcase-label">До</span>
              <div className="p-5 md:p-6">
                <BeforePhotoMock />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 py-4 text-center lg:px-2">
              <div className="showcase-arrow">
                <ArrowRight className="hidden lg:block" size={22} />
                <ArrowRight className="rotate-90 lg:hidden" size={22} />
              </div>
              <p className="text-3xl font-black text-white">30 сек</p>
              <p className="text-sm text-white/45">среднее время</p>
            </div>

            <div className="showcase-card showcase-card-featured">
              <span className="showcase-label showcase-label-accent">После · AI</span>
              <div className="p-4 md:p-5">
                <AfterCardMock />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={2}>
          <div className="mt-12 flex justify-center">
            <Link href="/cabinet#create">
              <Button className="px-8 py-3.5 text-base">
                Попробовать со своим товаром
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
