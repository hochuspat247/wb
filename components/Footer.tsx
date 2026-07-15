import Link from "next/link";
import { MetrikaGoalLink } from "@/components/analytics/MetrikaGoalLink";
import { Logo } from "@/components/Logo";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { BRAND } from "@/lib/branding";

const footerLinks = [
  { label: "Wildberries", href: "/wildberries", goal: "examples_click" as const },
  { label: "Публикация на WB", href: "/#wildberries", goal: "examples_click" as const },
  { label: "Ozon", href: "/ozon", goal: "examples_click" as const },
  { label: "Авито", href: "/avito", goal: "examples_click" as const },
  { label: "Примеры", href: "/#examples", goal: "examples_click" as const },
  { label: "Пример видео", href: "/#video-example", goal: "video_example_view" as const },
  { label: "Сравнение", href: "/#compare", goal: "compare_view" as const },
  { label: "Тарифы", href: "/#pricing", goal: "pricing_click" as const },
  { label: "Видео из карточки", href: "/#video-pricing", goal: "video_pricing_section_view" as const },
  { label: "FAQ", href: "/#faq", goal: "faq_view" as const }
];

export function Footer() {
  return (
    <footer className="border-t border-clay bg-paper-alt py-14 text-ink">
      <div className="section-shell">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-muted">
              ИИ-генератор карточек для Wildberries, Ozon и Авито: тексты, СЕО, обложки 4:5 из одного фото, публикация на ВБ через API и видео из карточки.
            </p>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Навигация</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <MetrikaGoalLink className="transition hover:text-ink" goal={link.goal} href={link.href}>
                    {link.label}
                  </MetrikaGoalLink>
                </li>
              ))}
              <li>
                <MetrikaGoalLink className="transition hover:text-ink" goal="click_create_card" href="/cabinet">
                  Кабинет
                </MetrikaGoalLink>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Контакты</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              <li>
                <a className="transition hover:text-ink" href="mailto:avenir.team.corp@gmail.com">
                  avenir.team.corp@gmail.com
                </a>
              </li>
              <li>
                <Link className="transition hover:text-ink" href="/#pricing-calculator">
                  Калькулятор тарифов
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 space-y-3 border-t border-clay pt-6 text-xs font-semibold text-muted">
          <LegalFooterLinks linkClassName="transition hover:text-ink" />
          <p>© {new Date().getFullYear()} {BRAND.marketCard} · ИП Головачев И.С. · ИНН 030403024370 · ОГРНИП 325237500009533</p>
        </div>
      </div>
    </footer>
  );
}
