"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, Clapperboard, Film, GitBranch, ImageIcon, PenLine, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { StoryStudioFaqSection } from "@/components/storystudio/StoryStudioFaqSection";
import { StoryStudioVideoDemo } from "@/components/storystudio/StoryStudioVideoDemo";
import { RelationsMapPreview } from "@/components/storystudio/RelationsMapPreview";
import { StoryPaymentButton } from "@/components/storystudio/StoryPaymentButton";
import { StoryPricingCard } from "@/components/storystudio/StoryPricingCard";
import { EXAMPLE_STORIES, RELATION_ADVANTAGE_POINTS, STORY_STATS, VIDEO_ADVANTAGE_POINTS } from "@/lib/storystudio/constants";
import {
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
    description: "Снимайте кинематографичные сцены из портретов персонажей — эксклюзив StoryStudio.",
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
    description: "Рисуйте стрелки между героями — AI учитывает связи в каждой главе.",
    badge: "Новинка"
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
              AI генератор историй: создай основу для{" "}
              <span className="bg-gradient-to-r from-violet via-cyan to-violet bg-clip-text text-transparent">
                новой книги или новеллы
              </span>{" "}
              за 30 секунд
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Персонажи, интерактивная <strong className="font-semibold text-ink">карта связей</strong>, главы, AI-портреты и{" "}
              <span className="text-violet">видео-серии Veo 3.1</span> — в одной студии для русскоязычных авторов.
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
              от {formatStoryRub(STORY_GENERATION_PRICE_RUB)}/ген · пакеты со скидкой до 41%
            </p>
          </div>
        </section>

        {/* Video advantage */}
        <section id="video-series" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="overflow-hidden rounded-container border border-violet/40 bg-gradient-to-br from-violet/20 via-[#0d0a18] to-cyan/10">
            <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet">
                  <Film className="h-3.5 w-3.5" />
                  Только в StoryStudio
                </span>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Видео-серии из вашей истории
                </h2>
                <p className="mt-4 text-muted">
                  Превратите портреты персонажей в кинематографичные сцены через Google Veo 3.1 — собирайте эпизоды
                  как сериал для Reels, Shorts и TikTok.
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
              <div className="relative flex items-center justify-center">
                <StoryStudioVideoDemo />
                <div className="absolute -right-4 -top-4 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
                  Veo 3.1
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Relations map */}
        <section id="relations" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="overflow-hidden rounded-container border border-cyan/25 bg-gradient-to-br from-cyan/10 via-[#0d0a18] to-violet/15">
            <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-12">
              <div className="order-2 lg:order-1">
                <RelationsMapPreview />
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan">
                  <GitBranch className="h-3.5 w-3.5" />
                  Карта связей
                </span>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Свяжи героев — AI напишет с учётом интриг</h2>
                <p className="mt-4 text-muted">
                  Не список в заметках, а живая карта: перетащите персонажей, проведите стрелку, выберите тип связи —
                  и каждая новая глава будет опираться на вашу драматургию.
                </p>
                <ul className="mt-6 space-y-3">
                  {RELATION_ADVANTAGE_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-0.5 text-cyan">▸</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/storystudio/cabinet">
                    <Button className="!bg-violet !text-white !border-violet">
                      <GitBranch className="h-4 w-4" />
                      Открыть карту связей
                    </Button>
                  </Link>
                  <span className="flex items-center text-sm text-muted">Shift + перетаскивание между героями</span>
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
            От {formatStoryRub(STORY_GENERATION_PRICE_RUB)} за генерацию · пакеты от{" "}
            {formatStoryRub(calculateStoryPackagePrice(10).total)}
          </p>

          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted">Начало работы</h3>
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
                      <Button className="w-full !border-violet !bg-violet !text-white">{plan.cta}</Button>
                    </Link>
                  ) : (
                    <StoryPaymentButton count={1} className="w-full !border-violet !bg-violet !text-white">
                      {plan.cta}
                    </StoryPaymentButton>
                  )
                }
              />
            ))}
          </div>

          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted">Пакеты генераций</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            {STORY_PACKAGES.map((pkg) => {
              const price = calculateStoryPackagePrice(pkg.count);

              return (
                <StoryPricingCard
                  key={pkg.id}
                  name={pkg.label}
                  price={formatStoryRub(price.total)}
                  period={`${formatStoryRub(price.pricePerUnit)}/ген · −${price.savingsPercent}%`}
                  features={pkg.features}
                  badge={pkg.badge}
                  highlighted={Boolean(pkg.badge)}
                  footer={
                    <StoryPaymentButton count={pkg.count} className="w-full !border-violet !bg-violet !text-white">
                      Купить {pkg.count}
                    </StoryPaymentButton>
                  }
                />
              );
            })}
          </div>
        </section>

        <StoryStudioFaqSection />

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

      <StoryStudioFooter />
    </div>
  );
}
