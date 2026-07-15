"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Clapperboard,
  Film,
  GitBranch,
  ImageIcon,
  Languages,
  PenLine,
  ScanSearch,
  Share2,
  Users,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { StoryStudioFaqSection } from "@/components/storystudio/StoryStudioFaqSection";
import { StoryStudioSeoLinksSection } from "@/components/storystudio/StoryStudioSeoLinksSection";
import { StoryStudioVideoDemo } from "@/components/storystudio/StoryStudioVideoDemo";
import { RelationsMapPreview } from "@/components/storystudio/RelationsMapPreview";
import { StorySampleResult } from "@/components/storystudio/StorySampleResult";
import { StoryPaymentButton } from "@/components/storystudio/StoryPaymentButton";
import { StoryPricingCard } from "@/components/storystudio/StoryPricingCard";
import { BRAND } from "@/lib/branding";
import {
  RELATION_ADVANTAGE_POINTS,
  STORY_CONTEXT_POINTS,
  STORY_TRUST_POINTS,
  VIDEO_ADVANTAGE_POINTS
} from "@/lib/storystudio/constants";
import {
  STORY_FREE_QUOTA_EXPLAINER,
  STORY_GENERATION_EXPLAINER,
  STORY_GENERATION_PRICE_RUB,
  STORY_PACK_10_EXPLAINER,
  STORY_PACKAGES,
  STORY_PREMIUM_FEATURES,
  STORY_PRICING_PLANS,
  calculateStoryPackagePrice,
  formatStoryRub
} from "@/lib/storystudio/pricing";
import { VIDEO_STANDARD_PRICE_4_SEC, formatVideoPriceRub } from "@/config/video-pricing";

const features = [
  {
    icon: Users,
    title: "Персонажи, мир и главы",
    description: "Всё важное для произведения хранится в одном проекте — без потери контекста.",
    badge: null
  },
  {
    icon: GitBranch,
    title: "Карта связей",
    description: "Отношения между героями влияют на то, как ИИ пишет следующие главы.",
    badge: null
  },
  {
    icon: PenLine,
    title: "Редактор глав",
    description: "Пишите и продолжайте историю главу за главой, возвращаясь к проекту когда угодно.",
    badge: null
  },
  {
    icon: Share2,
    title: "Поделиться и читать",
    description: "Публичная ссылка, режим чтения, печать и фирменный PDF.",
    badge: null
  },
  {
    icon: ScanSearch,
    title: "AI-анализ",
    description: "Разбор уже написанного: что работает, что улучшить и что можно добавить.",
    badge: null
  },
  {
    icon: ImageIcon,
    title: "Портреты и медиа",
    description: "Визуалы для персонажей, мира и глав из той же квоты кредитов.",
    badge: null
  },
  {
    icon: Languages,
    title: "5 языков",
    description: "Русский, английский, немецкий, французский или испанский.",
    badge: null
  },
  {
    icon: BookMarked,
    title: "Premium",
    description: STORY_PREMIUM_FEATURES.join(" "),
    badge: null
  },
  {
    icon: Clapperboard,
    title: "Видео-сцены",
    description: `Короткие сцены через ${BRAND.googleVeo} ${BRAND.veoVersion} — оплачиваются отдельно.`,
    badge: "Опция"
  },
  {
    icon: Zap,
    title: "Быстрый старт",
    description: "Соберите основу — синопсис, героев и план — за 1–2 минуты.",
    badge: null
  }
];

export function StoryStudioLanding() {
  return (
    <div className="min-h-screen text-ink">
      <StoryStudioHeader />

      <main className="relative pt-20 sm:pt-24">
        <section className="relative mx-auto max-w-content overflow-hidden px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-8 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[100px] animate-glow-pulse" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <p className="story-fairy-eyebrow mb-5 animate-reveal-up">✦ {BRAND.storyStudio} ✦</p>
            <h1 className="story-fairy-title animate-reveal-up text-[2.1rem] leading-[1.12] text-moon sm:text-5xl lg:text-6xl">
              Напишите свою историю с ИИ — от идеи до готовых глав
            </h1>
            <p
              className="mx-auto mt-5 max-w-2xl animate-reveal-up text-lg text-muted sm:mt-7 sm:text-xl"
              style={{ animationDelay: "80ms" }}
            >
              {BRAND.storyStudio} — рабочая среда для длинной истории: персонажи, мир, отношения и главы в одном
              кабинете, без потери контекста.
            </p>
            <div
              className="mt-8 flex animate-reveal-up flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
              style={{ animationDelay: "140ms" }}
            >
              <Link href="/storystudio/create" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full !border-gold !bg-gold !text-[#1a140f] shadow-[0_0_40px_rgba(212,180,131,0.35)] hover:!bg-[#e0c796] sm:w-auto"
                >
                  Попробовать бесплатно
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/storystudio#sample" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full border-[rgba(212,180,131,0.35)] bg-white/5 text-moon hover:bg-white/10 sm:w-auto"
                >
                  Смотреть пример результата
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Бесплатное демо без регистрации · романы, детективы, хоррор, фанфики · результат за 1–2 минуты
            </p>
          </div>
        </section>

        <StorySampleResult />

        <section id="context" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
          <div className="story-fairy-panel rounded-container p-6 sm:p-10">
            <p className="story-fairy-eyebrow">Почему не обычный чат</p>
            <h2 className="story-fairy-title mt-3 max-w-3xl text-3xl text-moon sm:text-4xl">
              Обычный чат пишет куски текста. {BRAND.storyStudio} помнит целое произведение.
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {STORY_CONTEXT_POINTS.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-muted">
                  <span className="text-gold">✦</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-[rgba(212,180,131,0.12)] bg-white/[0.02] py-10 sm:py-12">
          <div className="mx-auto grid max-w-content grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:gap-8 sm:px-6 lg:grid-cols-4">
            {STORY_TRUST_POINTS.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <div className="font-fairy text-2xl font-semibold text-gold">{stat.value}</div>
                <div className="mt-1 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="relations" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
          <div className="story-fairy-panel overflow-hidden rounded-container">
            <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-12">
              <div className="order-2 lg:order-1">
                <RelationsMapPreview />
              </div>
              <div className="order-1 text-center lg:order-2 lg:text-left">
                <p className="story-fairy-eyebrow">
                  <GitBranch className="mr-1.5 inline h-3.5 w-3.5" />
                  Карта связей
                </p>
                <h2 className="story-fairy-title mt-4 text-3xl text-moon sm:text-4xl">
                  Карта отношений: ИИ пишет с учётом интриг
                </h2>
                <p className="mt-4 text-muted">
                  Перетащите персонажей, проведите связи — и каждая новая глава будет помнить союзы, конфликты и
                  напряжение между героями.
                </p>
                <ul className="mt-6 space-y-3">
                  {RELATION_ADVANTAGE_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-0.5 text-mist">✦</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row lg:items-start">
                  <Link href="/storystudio/create" className="w-full sm:w-auto">
                    <Button className="w-full !border-gold !bg-gold !text-[#1a140f] sm:w-auto">
                      Собрать свою карту
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
          <div className="mb-8 text-center">
            <p className="story-fairy-eyebrow">Возможности</p>
            <h2 className="story-fairy-title mt-3 text-3xl text-moon sm:text-4xl">Всё для цельного произведения</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="story-fairy-panel rounded-card p-6 transition hover:border-gold/35">
                <div className="mb-4 flex items-center justify-between">
                  <feature.icon className="h-6 w-6 text-gold" />
                  {feature.badge && (
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold">{feature.badge}</span>
                  )}
                </div>
                <h3 className="font-fairy text-xl font-semibold text-moon">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
          <h2 className="story-fairy-title mb-2 text-center text-3xl text-moon sm:text-4xl">Тарифы</h2>
          <p className="mx-auto mb-4 max-w-2xl text-center text-muted">
            Без подписки. От {formatStoryRub(STORY_GENERATION_PRICE_RUB)} за кредит.
          </p>
          <p className="mx-auto mb-10 max-w-2xl rounded-xl border border-[rgba(212,180,131,0.2)] bg-white/[0.03] px-4 py-3 text-center text-sm text-muted">
            {STORY_GENERATION_EXPLAINER}
            <br />
            <span className="text-moon">{STORY_FREE_QUOTA_EXPLAINER}</span>
            <br />
            <span className="text-moon">{STORY_PACK_10_EXPLAINER}</span>
          </p>

          <h3 className="mb-4 text-center story-fairy-eyebrow">Начало работы</h3>
          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
            {STORY_PRICING_PLANS.map((plan) => (
              <StoryPricingCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                period={plan.period || undefined}
                features={[...plan.features]}
                highlighted={plan.highlighted}
                footer={
                  plan.id === "free" ? (
                    <Link href="/storystudio/create">
                      <Button className="w-full !border-gold !bg-gold !text-[#1a140f]">{plan.cta}</Button>
                    </Link>
                  ) : (
                    <StoryPaymentButton count={1} className="w-full !border-gold !bg-gold !text-[#1a140f]">
                      {plan.cta}
                    </StoryPaymentButton>
                  )
                }
              />
            ))}
          </div>

          <h3 className="mb-4 text-center story-fairy-eyebrow">Пакеты кредитов</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {STORY_PACKAGES.map((pkg) => {
              const price = calculateStoryPackagePrice(pkg.count);
              return (
                <StoryPricingCard
                  key={pkg.id}
                  name={pkg.label}
                  price={formatStoryRub(price.total)}
                  period={`${formatStoryRub(price.pricePerUnit)}/кредит · −${price.savingsPercent}%`}
                  features={pkg.features}
                  badge={pkg.badge}
                  highlighted={Boolean(pkg.badge)}
                  footer={
                    <StoryPaymentButton count={pkg.count} className="w-full !border-gold !bg-gold !text-[#1a140f]">
                      Купить {pkg.count}
                    </StoryPaymentButton>
                  }
                />
              );
            })}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted">
            Видео всегда отдельно — от {formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}.
          </p>
        </section>

        <section id="video-series" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
          <div className="story-fairy-panel overflow-hidden rounded-container">
            <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-12">
              <div className="text-center lg:text-left">
                <p className="story-fairy-eyebrow">
                  <Film className="mr-1.5 inline h-3.5 w-3.5" />
                  Дополнительная возможность
                </p>
                <h2 className="story-fairy-title mt-4 text-3xl text-moon sm:text-4xl">
                  Видео-сцены из вашей истории
                </h2>
                <p className="mt-4 text-muted">
                  Когда готовы портреты, можно создать короткую видео-сцену через {BRAND.googleVeo}{" "}
                  {BRAND.veoVersion}. Это не замена тексту — а визуальный слой уже собранной истории.
                </p>
                <ul className="mt-6 space-y-3">
                  {VIDEO_ADVANTAGE_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-0.5 text-gold">✦</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row lg:items-start">
                  <Link href="/storystudio/create" className="w-full sm:w-auto">
                    <Button className="w-full !border-gold !bg-gold !text-[#1a140f] sm:w-auto">
                      <Clapperboard className="h-4 w-4" />
                      Сначала создать историю
                    </Button>
                  </Link>
                  <span className="text-sm text-muted">
                    затем видео — от {formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}
                  </span>
                </div>
              </div>
              <div className="relative flex items-center justify-center pt-2 lg:justify-end lg:pt-0">
                <StoryStudioVideoDemo />
                <div className="absolute right-0 top-0 rounded-full border border-mist/30 bg-mist/10 px-3 py-1 text-xs font-semibold text-mist">
                  {BRAND.googleVeo} {BRAND.veoVersion}
                </div>
              </div>
            </div>
          </div>
        </section>

        <StoryStudioSeoLinksSection />
        <StoryStudioFaqSection />

        <section className="mx-auto max-w-content px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="story-fairy-panel rounded-container p-6 text-center sm:p-10">
            <h2 className="story-fairy-title text-3xl text-moon sm:text-4xl">
              Начните цельное произведение в {BRAND.storyStudio}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Соберите идею, персонажей и главы — а потом продолжайте историю, не теряя контекст.
            </p>
            <Link href="/storystudio/create" className="mt-6 inline-block w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full !border-gold !bg-gold !text-[#1a140f] shadow-[0_0_40px_rgba(212,180,131,0.3)] sm:w-auto"
              >
                Попробовать бесплатно
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <StoryStudioFooter />
    </div>
  );
}
