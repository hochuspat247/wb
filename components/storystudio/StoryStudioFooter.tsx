import Link from "next/link";
import { MoonStar } from "lucide-react";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { BRAND } from "@/lib/branding";
import { storyStudioMarketingPages } from "@/lib/storystudio/marketingPages";

const footerLinks = [
  { label: "Пример результата", href: "/storystudio#sample" },
  { label: "Карта связей", href: "/storystudio#relations" },
  { label: "Как работает", href: "/storystudio#workflow" },
  { label: "Тарифы", href: "/storystudio#pricing" },
  { label: "Видео-сцены", href: "/storystudio#video-series" },
  { label: "FAQ", href: "/storystudio#faq" },
  { label: "Создать", href: "/storystudio/create" }
];

export function StoryStudioFooter() {
  return (
    <footer className="relative mt-8 border-t border-[rgba(212,180,131,0.15)] py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="section-shell px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div>
            <Link href="/storystudio" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,180,131,0.35)] bg-[rgba(212,180,131,0.12)] text-gold">
                <MoonStar className="h-4 w-4" />
              </span>
              <span className="font-fairy text-xl font-semibold tracking-tight text-moon">
                {BRAND.storyStudio}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Рабочая среда для авторов: персонажи, мир, карта связей и главы в одном проекте — без потери контекста.
            </p>
          </div>

          <div>
            <p className="story-fairy-eyebrow">Навигация</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-gold" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="transition hover:text-gold" href="/storystudio/cabinet">
                  Кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="story-fairy-eyebrow">Для авторов</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {storyStudioMarketingPages.map((page) => (
                <li key={page.slug}>
                  <Link className="transition hover:text-gold" href={page.path}>
                    {page.badge}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="story-fairy-eyebrow">Контакты</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a className="transition hover:text-gold" href="mailto:avenir.team.corp@gmail.com">
                  avenir.team.corp@gmail.com
                </a>
              </li>
              <li>
                <Link className="transition hover:text-gold" href="/">
                  Карточки для маркетплейсов
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-3 border-t border-[rgba(212,180,131,0.12)] pt-5 text-center text-[11px] leading-relaxed text-muted/80 sm:mt-12 sm:pt-6 sm:text-left sm:text-xs">
          <LegalFooterLinks
            className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-3 sm:gap-y-1"
            linkClassName="transition hover:text-gold"
          />
          <p>
            © {new Date().getFullYear()} {BRAND.storyStudio} · ИП Головачев И.С. · ИНН 030403024370 · ОГРНИП
            325237500009533
          </p>
        </div>
      </div>
    </footer>
  );
}
