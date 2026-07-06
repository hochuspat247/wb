import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-clay bg-card py-14">
      <div className="section-shell">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Инструмент для продавцов маркетплейсов: тексты, SEO и премиальные обложки 4:5 из одного фото товара.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Навигация</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <Link className="transition hover:text-ink" href="/#workflow">
                  Возможности
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-ink" href="/#examples">
                  Примеры
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-ink" href="/#pricing">
                  Тарифы
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-ink" href="/cabinet">
                  Кабинет
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Контакты</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a className="transition hover:text-ink" href="mailto:hello@marketcard.ai">
                  hello@marketcard.ai
                </a>
              </li>
              <li>
                <Link className="transition hover:text-ink" href="/#faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-clay pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} MarketCard AI · ИП Головачев И.С. · ИНН 030403024370</p>
          <p>MVP для проверки продуктовой гипотезы</p>
        </div>
      </div>
    </footer>
  );
}
