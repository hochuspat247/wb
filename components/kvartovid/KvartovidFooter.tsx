import Link from "next/link";
import { Building2 } from "lucide-react";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { kvartovidMarketingPages } from "@/lib/kvartovid/marketingPages";

const footerLinks = [
  { label: "Возможности", href: "/kvartovid#features" },
  { label: "Как работает", href: "/kvartovid#workflow" },
  { label: "Для кого", href: "/kvartovid#audience" },
  { label: "Тарифы", href: "/kvartovid#pricing" },
  { label: "FAQ", href: "/kvartovid#faq" },
  { label: "Создать", href: "/kvartovid/create" }
];

export function KvartovidFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#060d0b] py-10 text-ink sm:py-14">
      <div className="section-shell px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/kvartovid" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-ink">
                Кварто<span className="text-amber-400">Вид</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-muted">
              ИИ-сервис для упаковки объявлений о недвижимости: текст, преимущества и обложка за минуту.
            </p>
          </div>

          <div>
            <p className="text-sm font-black text-ink">Навигация</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-amber-400" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="transition hover:text-amber-400" href="/kvartovid/cabinet">
                  Кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-black text-ink">Сценарии</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              {kvartovidMarketingPages.map((page) => (
                <li key={page.slug}>
                  <Link className="transition hover:text-amber-400" href={page.path}>
                    {page.badge}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-black text-ink">Другие продукты</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              <li>
                <Link className="transition hover:text-amber-400" href="/">
                  МаркетКард ИИ
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-amber-400" href="/storystudio">
                  СториСтудио
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <LegalFooterLinks />
        </div>
      </div>
    </footer>
  );
}
