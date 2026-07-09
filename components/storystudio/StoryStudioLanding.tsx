"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, Clapperboard, Film, GitBranch, ImageIcon, PenLine, Play, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryPaymentButton } from "@/components/storystudio/StoryPaymentButton";
import { EXAMPLE_STORIES, STORY_STATS, VIDEO_ADVANTAGE_POINTS } from "@/lib/storystudio/constants";
import {
  COMPETITOR_MONTHLY_EQUIV_RUB,
  STORYSTUDIO_MONTHLY_EQUIV_RUB,
  STORY_GENERATION_PRICE_RUB,
  STORY_PACKAGES,
  STORY_PRICING_PLANS,
  calculateStoryPackagePrice,
  formatStoryRub
} from "@/lib/storystudio/pricing";
import { VIDEO_STANDARD_PRICE_4_SEC, formatVideoPriceRub } from "@/config/video-pricing";

const features = [
  {
    icon: Clapperboard,
    title: "Видео-серии из истории",
    description: "Снимайте кинематографичные сцены из портретов персонажей. Novely такого не умеет.",
    badge: "Только у нас"
  },
  {
    icon: Zap,
    title: "Быстрый старт",
    description: "Запустите основу истории по одной идее за считанные минуты.",
    badge: null
  },
  {
    icon: Users,
    title: "Персонажи, мир и главы",
    description: "Собирайте всё важное для истории в одной аккуратной рабочей зоне.",
    badge: null
  },
  {
    icon: ImageIcon,
    title: "Генерация портретов",
    description: "Создавайте иллюстрации персонажей прямо в рабочем процессе.",
    badge: "Новинка"
  },
  {
    icon: GitBranch,
    title: "Дерево связей",
    description: "Визуализируйте отношения героев — союзники, враги, любовь и интриги.",
    badge: null
  },
  {
    icon: PenLine,
    title: "Редактор глав",
    description: "Пишите и редактируйте с AI-помощником, продолжайте историю главу за главой.",
    badge: null
  },
  {
    icon: BookMarked,
    title: "Premium 18+",
    description: "Выберите нужный режим и сохраняйте дерзкую интонацию истории.",
    badge: "Premium"
  }
];

export function StoryStudioLanding() {
  return (
    <div className="min-h-screen bg-[#07050d] text-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-violet/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-cyan/10 blur-[100px]" />
      </div>

      <StoryStudioHeader />

      <main className="relative pt-24">
        {/* Hero */}
        <section className="mx-auto max-w-content px-4 pb-20 pt-12 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-4 py-1.5 text-sm text-violet">
              <Sparkles className="h-3.5 w-3.5" />
              AI-генератор историй
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Создай основу для{" "}
              <span className="bg-gradient-to-r from-violet via-cyan to-violet bg-clip-text text-transparent">
                новой истории
              </span>{" "}
              за 30 секунд
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Персонажи, мир, главы, портреты и <span className="text-violet">видео-серии</span> — в одной студии.
              Дешевле Novely, мощнее и удобнее для русскоязычных авторов.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/storystudio/create">
                <Button size="lg" className="!bg-violet !text-white !border-violet hover:!bg-[#9d8bff]">
                  Создать новую историю
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/storystudio/cabinet">
                <Button size="lg" variant="secondary">
                  Мои истории
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              от {formatStoryRub(STORY_GENERATION_PRICE_RUB)}/ген · на ~{Math.round((1 - STORYSTUDIO_MONTHLY_EQUIV_RUB / COMPETITOR_MONTHLY_EQUIV_RUB) * 100)}% дешевле аналогов
            </p>
          </div>
        </section>

        {/* Video advantage — competitive differentiator */}
        <section id="video-series" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="overflow-hidden rounded-container border border-violet/40 bg-gradient-to-br from-violet/20 via-[#0d0a18] to-cyan/10">
            <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet">
                  <Film className="h-3.5 w-3.5" />
                  Конкурентное преимущество
                </span>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Видео-серии из вашей истории
                </h2>
                <p className="mt-4 text-muted">
                  Novely останавливается на тексте и статичных картинках. StoryStudio снимает кинематографичные сцены
                  из портретов персонажей через Google Veo 3.1 — собирайте эпизоды как сериал для Reels, Shorts и TikTok.
                </p>
                <ul className="mt-6 space-y-3">
                  {VIDEO_ADVANTAGE_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-0.5 text-violet">▸</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/storystudio/cabinet">
                    <Button className="!bg-violet !text-white !border-violet">
                      <Clapperboard className="h-4 w-4" />
                      Снять первую серию
                    </Button>
                  </Link>
                  <span className="flex items-center text-sm text-muted">
                    от {formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)} / 4 сек
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="grid gap-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="flex items-center gap-4 rounded-card border border-white/10 bg-card/80 p-4 backdrop-blur-sm"
                      style={{ marginLeft: `${(n - 1) * 12}px` }}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet/20 text-violet">
                        <Play className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">Серия {n}</p>
                        <p className="text-xs text-muted">
                          {n === 1 ? "Портрет → кинематографичная сцена" : n === 2 ? "Глава → видео-эпизод" : "Серия для соцсетей 9:16"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute -right-4 -top-4 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
                  Veo 3.1
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Всё для вашей истории</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-card border border-white/10 bg-card/60 p-6 backdrop-blur-sm transition hover:border-violet/30"
              >
                <div className="mb-4 flex items-center justify-between">
                  <feature.icon className="h-6 w-6 text-violet" />
                  {feature.badge && (
                    <span className="rounded-full bg-violet/20 px-2.5 py-0.5 text-xs text-violet">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/10 bg-white/[0.02] py-14">
          <div className="mx-auto grid max-w-content grid-cols-2 gap-8 px-4 sm:grid-cols-4 sm:px-6">
            {STORY_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-violet sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section id="examples" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">Найди историю, с которой хочется начать</h2>
          <p className="mb-10 text-center text-muted">Или создай свою с нуля</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXAMPLE_STORIES.map((story) => (
              <Link
                key={story.title}
                href="/storystudio/create"
                className="group rounded-card border border-white/10 bg-card p-5 transition hover:border-violet/40 hover:bg-violet/5"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-violet">{story.type}</span>
                <h3 className="mt-2 font-semibold text-ink group-hover:text-violet">{story.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{story.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {story.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">Тарифы</h2>
          <p className="mb-10 text-center text-muted">
            Novely ≈ {formatStoryRub(COMPETITOR_MONTHLY_EQUIV_RUB)}/мес · StoryStudio от{" "}
            {formatStoryRub(STORYSTUDIO_MONTHLY_EQUIV_RUB)}/мес эквивалент
          </p>

          <div className="mb-12 grid gap-4 lg:grid-cols-3">
            {STORY_PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-card border p-6 ${
                  plan.highlighted ? "border-violet bg-violet/10" : "border-white/10 bg-card"
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-violet">{plan.price}</span>
                  {plan.period && <span className="ml-2 text-sm text-muted">{plan.period}</span>}
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-1 text-violet">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.id === "free" ? (
                    <Link href="/storystudio/create">
                      <Button className="w-full !bg-violet !text-white !border-violet">{plan.cta}</Button>
                    </Link>
                  ) : plan.id === "pack" ? (
                    <StoryPaymentButton count={50} className="w-full !bg-violet !text-white !border-violet">
                      {plan.cta}
                    </StoryPaymentButton>
                  ) : (
                    <StoryPaymentButton count={10} className="w-full !bg-violet !text-white !border-violet">
                      {plan.cta}
                    </StoryPaymentButton>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {STORY_PACKAGES.map((pkg) => {
              const price = calculateStoryPackagePrice(pkg.count);
              return (
                <div key={pkg.id} className="rounded-card border border-white/10 bg-card p-5">
                  {pkg.badge && (
                    <span className="mb-2 inline-block rounded-full bg-violet/20 px-2 py-0.5 text-xs text-violet">
                      {pkg.badge}
                    </span>
                  )}
                  <h4 className="font-semibold">{pkg.label}</h4>
                  <p className="text-2xl font-bold text-violet">{formatStoryRub(price.total)}</p>
                  <p className="text-xs text-muted">
                    {formatStoryRub(price.pricePerUnit)}/ген · −{price.savingsPercent}%
                  </p>
                  <p className="mt-2 text-sm text-muted">{pkg.description}</p>
                  <div className="mt-4">
                    <StoryPaymentButton count={pkg.count} variant="secondary" className="w-full">
                      Купить {pkg.count}
                    </StoryPaymentButton>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-content px-4 pb-24 sm:px-6">
          <div className="rounded-container border border-violet/30 bg-gradient-to-br from-violet/20 via-card to-cyan/10 p-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Продолжите уже в StoryStudio</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Соберите персонажей, мир и главы в одной рабочей зоне, а затем развивайте историю дальше с помощью AI.
            </p>
            <Link href="/storystudio/create" className="mt-6 inline-block">
              <Button size="lg" className="!bg-violet !text-white !border-violet">
                Начать свою историю
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        <p>
          StoryStudio — продукт для проверки гипотезы ·{" "}
          <Link href="/" className="text-violet hover:underline">
            MarketCard AI
          </Link>
        </p>
      </footer>
    </div>
  );
}
