"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

const links = [
  ["Примеры", "/#examples"],
  ["Генератор", "/#demo"],
  ["Как работает", "/#how"],
  ["Тарифы", "/#pricing"],
  ["FAQ", "/#faq"]
];

export function Header() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAuthed = status === "authenticated";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-clay bg-paper/88 backdrop-blur-xl" : "bg-paper/72 backdrop-blur-sm"
      }`}
    >
      <div className="section-shell flex min-h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              className="relative px-3 py-2 text-sm font-semibold text-muted transition after:absolute after:bottom-1 after:left-3 after:h-px after:w-0 after:bg-accent after:transition-all hover:text-ink hover:after:w-[calc(100%-1.5rem)]"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthed ? (
            <>
              <Link href="/cabinet">
                <Button variant="ghost">{session?.user?.name || "Кабинет"}</Button>
              </Link>
              <Link href="/cabinet#create">
                <Button>Попробовать бесплатно</Button>
              </Link>
              <Button onClick={() => signOut({ callbackUrl: "/" })} variant="secondary">
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Войти</Button>
              </Link>
              <Link href="/register">
                <Button>Попробовать бесплатно</Button>
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Меню"
          className="grid h-10 w-10 place-items-center rounded-full border border-clay bg-card lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-clay bg-card/95 px-5 py-4 backdrop-blur-xl lg:hidden">
          <nav className="grid gap-1">
            {links.map(([label, href]) => (
              <Link
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink"
                href={href}
                key={href}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-4 grid gap-2 border-t border-clay pt-4">
              {isAuthed ? (
                <>
                  <Link href="/cabinet" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full" variant="secondary">
                      Кабинет
                    </Button>
                  </Link>
                  <Link href="/cabinet#create" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">Создать карточку</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full" variant="secondary">
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full">Попробовать бесплатно</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
