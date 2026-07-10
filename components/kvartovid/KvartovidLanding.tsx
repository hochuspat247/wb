"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Camera,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  Sparkles,
  Star,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KvartovidHeader } from "@/components/kvartovid/KvartovidHeader";
import { KvartovidFooter } from "@/components/kvartovid/KvartovidFooter";
import { KvartovidFaqSection } from "@/components/kvartovid/KvartovidFaqSection";
import { KvartovidAudienceSection } from "@/components/kvartovid/KvartovidAudienceSection";
import { KvartovidSeoLinksSection } from "@/components/kvartovid/KvartovidSeoLinksSection";
import { KvartovidWorkflowSection } from "@/components/kvartovid/KvartovidWorkflowSection";
import { KvartovidPricingSection } from "@/components/kvartovid/KvartovidPricingSection";
import { KvartovidVideoDemo } from "@/components/kvartovid/KvartovidVideoDemo";
import { KvartovidFloorPlanFeatureSection } from "@/components/kvartovid/KvartovidFloorPlanFeatureSection";
import { BRAND } from "@/lib/branding";
import {
  KVARTOVID_KILLER_FEATURES,
  KVARTOVID_POSITIONING,
  KVARTOVID_STATS,
  KVARTOVID_TAGLINE
} from "@/lib/kvartovid/constants";
import { formatKvartovidRub, KVARTOVID_PRICES } from "@/lib/kvartovid/pricing";

const featureIcons = {
  cover: Camera,
  highlights: Sparkles,
  platforms: FileText,
  floorplan: LayoutGrid,
  video: Video,
  checklist: ClipboardCheck,
  score: Star,
  realtor: Building2
} as const;

export function KvartovidLanding() {
  return (
    <div className="min-h-screen bg-[#060d0b] text-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <KvartovidHeader />

      <main className="relative pt-20 sm:pt-24">
        <section className="mx-auto max-w-content px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 sm:mb-6 sm:px-4 sm:text-sm">
              <Building2 className="h-3.5 w-3.5" />
              ИИ для объявлений о недвижимости
            </div>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl lg:text-6xl">
              {KVARTOVID_TAGLINE}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:mt-6 sm:text-lg">
              Загрузите фото и параметры объекта —{" "}
              <strong className="font-semibold text-ink">{BRAND.kvartovid}</strong> подготовит продающее описание,
              обложку, карточки преимуществ и короткое видео для Авито, Циан, Домклик и соцсетей.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm text-amber-400/90">{KVARTOVID_POSITIONING}</p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <Link href="/kvartovid/create" className="w-full sm:w-auto">
                <Button size="lg" className="w-full !border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400 sm:w-auto">
                  Создать объявление
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/kvartovid#features" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Смотреть возможности
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              от {formatKvartovidRub(KVARTOVID_PRICES.listing)} за объект · 1 бесплатно с водяным знаком
            </p>
          </div>
        </section>

        <KvartovidWorkflowSection />

        <section id="cover-feature" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
          <div className="overflow-hidden rounded-container border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#0a1210] to-emerald-500/10">
            <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-12">
              <KvartovidVideoDemo />
              <div className="rounded-card border border-white/10 bg-[#0a1210]/80 p-6 text-center lg:text-left">
                <p className="text-sm font-semibold text-amber-400">Оживите фото квартиры</p>
                <p className="mt-3 text-lg font-bold text-ink">Видео-тур для объявления</p>
                <p className="mt-2 text-sm text-muted">
                  Одно фото превращается в короткий кинематографичный ролик — для Авито, Циан, Домклик, Рилс и
                  Stories. Без съёмки и монтажа.
                </p>
              </div>
            </div>
          </div>
        </section>

        <KvartovidFloorPlanFeatureSection />

        <section id="features" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Возможности {BRAND.kvartovid}</h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KVARTOVID_KILLER_FEATURES.map((feature) => {
              const Icon = featureIcons[feature.id as keyof typeof featureIcons] ?? Sparkles;
              const comingSoon = "comingSoon" in feature && feature.comingSoon;
              return (
                <div
                  key={feature.id}
                  className="rounded-card border border-white/10 bg-card/50 p-6 transition hover:border-amber-500/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    {comingSoon ? (
                      <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                        Скоро
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <KvartovidAudienceSection />
        <KvartovidSeoLinksSection />
        <KvartovidPricingSection />

        <section className="border-y border-white/10 bg-white/[0.02] py-10 sm:py-14">
          <div className="mx-auto grid max-w-content grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
            {KVARTOVID_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black text-amber-400 sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <KvartovidFaqSection />

        <section className="mx-auto max-w-content px-4 py-12 sm:px-6 sm:py-20">
          <div className="rounded-container border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-emerald-500/5 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Упакуйте квартиру в объявление за минуту</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Фото квартиры → готовый текст, преимущества и обложка. Попробуйте бесплатно.
            </p>
            <Link href="/kvartovid/create" className="mt-6 inline-block">
              <Button size="lg" className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">
                Создать объявление
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <KvartovidFooter />
    </div>
  );
}
