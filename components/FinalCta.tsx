import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="py-24">
      <div className="section-shell">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-8 py-16 text-center text-white md:px-16 md:py-20">
            <div className="glow-orb -left-20 top-0 h-72 w-72 bg-coral/30" />
            <div className="glow-orb -right-20 bottom-0 h-72 w-72 bg-violet/25" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')] opacity-50" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black leading-tight md:text-5xl">
                Первая карточка — <span className="gradient-text-light">бесплатно</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/60">
                Загрузите фото, опишите товар — и через пару минут получите премиальный креатив для маркетплейса.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/cabinet#create">
                  <Button className="btn-glow px-8 py-3 text-base shadow-glow">
                    Создать карточку бесплатно
                    <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link href="/cabinet">
                  <Button className="border border-white/20 bg-white/10 px-8 py-3 text-base text-white backdrop-blur-sm hover:bg-white/20" variant="ghost">
                    <LayoutDashboard size={18} />
                    Личный кабинет
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/40">Без карты · Без регистрации · Результат сразу</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
