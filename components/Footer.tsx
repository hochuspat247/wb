import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-clay bg-paper py-14 text-white">
      <div className="section-shell">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-white/55">
              Инструмент для продавцов маркетплейсов: тексты, SEO и премиальные обложки 4:5 из одного фото товара.
            </p>
          </div>
          <div>
            <p className="text-sm font-black text-white">Навигация</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-white/55">
              <li>
                <Link className="transition hover:text-white" href="/#workflow">
                  Возможности
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/#examples">
                  Примеры
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/#compare">
                  Сравнение
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/#pricing">
                  Тарифы
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/cabinet">
                  Кабинет
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-black text-white">Контакты</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold text-white/55">
              <li>
                <a className="transition hover:text-white" href="mailto:avenir.team.corp@gmail.com">
                  avenir.team.corp@gmail.com
                </a>
              </li>
              <li>
                <Link className="transition hover:text-white" href="/#faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs font-semibold text-white/40">
          <p>© {new Date().getFullYear()} MarketCard AI · ИП Головачев И.С. · ИНН 030403024370 · ОГРНИП 325237500009533</p>
        </div>
      </div>
    </footer>
  );
}
