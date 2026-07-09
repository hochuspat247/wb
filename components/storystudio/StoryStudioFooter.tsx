import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerLinks = [
  { label: "Видео-серии", href: "/storystudio#video-series" },
  { label: "Карта связей", href: "/storystudio#relations" },
  { label: "Возможности", href: "/storystudio#features" },
  { label: "Примеры", href: "/storystudio#examples" },
  { label: "Тарифы", href: "/storystudio#pricing" },
  { label: "FAQ", href: "/storystudio#faq" },
  { label: "Создать", href: "/storystudio/create" }
];

export function StoryStudioFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#07050d] py-14 text-ink">
      <div className="section-shell">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href="/storystudio" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet/20 text-violet">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-ink">
                Story<span className="text-violet">Studio</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-muted">
              AI-студия для авторов: истории, персонажи, карта связей, главы и видео-серии из портретов героев.
            </p>
          </div>

          <div>
            <p className="text-sm font-black text-ink">Навигация</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link className="transition hover:text-violet" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="transition hover:text-violet" href="/storystudio/cabinet">
                  Кабинет
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-black text-ink">Контакты</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-muted">
              <li>
                <a className="transition hover:text-violet" href="mailto:avenir.team.corp@gmail.com">
                  avenir.team.corp@gmail.com
                </a>
              </li>
              <li>
                <Link className="transition hover:text-violet" href="/">
                  Карточки для маркетплейсов
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs font-semibold text-muted/80">
          <p>© {new Date().getFullYear()} StoryStudio · ИП Головачев И.С. · ИНН 030403024370 · ОГРНИП 325237500009533</p>
        </div>
      </div>
    </footer>
  );
}
