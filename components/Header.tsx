"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  ["Как работает", "/#how"],
  ["Возможности", "/#features"],
  ["Тарифы", "/#pricing"]
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-ink/5 bg-white/75 shadow-soft backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="section-shell flex min-h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              className="rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:bg-ink/5 hover:text-ink"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
          <Link
            className="ml-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:bg-violet/10 hover:text-violet"
            href="/cabinet"
          >
            <LayoutDashboard size={16} />
            Кабинет
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/cabinet#create">
            <Button className="btn-glow px-6 shadow-glow">Создать карточку</Button>
          </Link>
        </div>

        <button
          aria-label="Меню"
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink/10 bg-white/80 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-ink/5 bg-white/95 px-5 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="grid gap-1">
            {links.map(([label, href]) => (
              <Link
                className="rounded-xl px-4 py-3 text-sm font-semibold text-ink"
                href={href}
                key={href}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-violet"
              href="/cabinet"
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard size={16} />
              Личный кабинет
            </Link>
            <Link className="mt-2 block" href="/cabinet#create" onClick={() => setMenuOpen(false)}>
              <Button className="w-full">Создать карточку</Button>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
