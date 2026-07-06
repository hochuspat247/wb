import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="relative border-t border-ink/5 bg-white/80 py-14 backdrop-blur-sm">
      <div className="section-shell">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              AI-сервис для создания премиальных карточек товаров на маркетплейсах.
            </p>
          </div>
          <div className="flex flex-wrap gap-12 text-sm">
            <div>
              <p className="font-bold text-ink">Продукт</p>
              <ul className="mt-4 space-y-2.5 text-muted">
                <li><Link className="transition hover:text-coral" href="/#how">Как работает</Link></li>
                <li><Link className="transition hover:text-coral" href="/#features">Возможности</Link></li>
                <li><Link className="transition hover:text-coral" href="/#pricing">Тарифы</Link></li>
                <li><Link className="transition hover:text-coral" href="/cabinet">Личный кабинет</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-ink">Поддержка</p>
              <ul className="mt-4 space-y-2.5 text-muted">
                <li><Link className="transition hover:text-coral" href="/#faq">Вопросы</Link></li>
                <li><Link className="transition hover:text-coral" href="/cabinet#create">Создать карточку</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-ink/5 pt-6 text-xs text-muted">
          <p>© {new Date().getFullYear()} MarketCard AI · ИП Головачев И.С. · ИНН 030403024370</p>
        </div>
      </div>
    </footer>
  );
}
