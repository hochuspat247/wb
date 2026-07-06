"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  ["Как работает", "/#how"],
  ["Возможности", "/#features"],
  ["Тарифы", "/#pricing"]
];

export function Header() {
  const { data: session, status } = useSession();
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

  const isAuthed = status === "authenticated";

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
          {isAuthed ? (
            <Link
              className="ml-2 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-muted transition hover:bg-violet/10 hover:text-violet"
              href="/cabinet"
            >
              <LayoutDashboard size={16} />
              Кабинет
            </Link>
          ) : null}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthed ? (
            <>
              <span className="max-w-[180px] truncate text-sm font-semibold text-muted">
                {session?.user?.name || session?.user?.email}
              </span>
              <Link href="/cabinet#create">
                <Button className="btn-glow px-6 shadow-glow">Создать карточку</Button>
              </Link>
              <Button onClick={() => signOut({ callbackUrl: "/" })} variant="secondary">
                <LogOut size={16} />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary">Войти</Button>
              </Link>
              <Link href="/register">
                <Button className="btn-glow px-6 shadow-glow">Регистрация</Button>
              </Link>
            </>
          )}
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
            {isAuthed ? (
              <>
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
                <button
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-ink/10 px-5 py-3 text-sm font-bold text-muted"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  type="button"
                >
                  <LogOut size={16} />
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link className="mt-2 block" href="/login" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full" variant="secondary">
                    <User size={16} />
                    Войти
                  </Button>
                </Link>
                <Link className="mt-2 block" href="/register" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Регистрация</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
