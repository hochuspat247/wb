"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/branding";

const links = [
  ["Возможности", "/kvartovid#features"],
  ["Как работает", "/kvartovid#workflow"],
  ["Для кого", "/kvartovid#audience"],
  ["Тарифы", "/kvartovid#pricing"],
  ["FAQ", "/kvartovid#faq"],
  ["Создать", "/kvartovid/create"],
  ["Кабинет", "/kvartovid/cabinet"]
] as const;

export function KvartovidHeader() {
  const { status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthed = status === "authenticated";

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-[#081210]/90 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/kvartovid" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-ink sm:text-lg">
            Кварто<span className="text-amber-400">Вид</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3.5 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthed ? (
            <>
              <Link href="/kvartovid/cabinet">
                <Button variant="secondary" size="sm">
                  Мои объявления
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/kvartovid" })}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login?callbackUrl=/kvartovid/create">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/kvartovid/create">
                <Button size="sm" className="!border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400">
                  Создать объявление
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-ink md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-[#081210]/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/kvartovid/create" onClick={() => setMenuOpen(false)}>
              <Button className="w-full !border-amber-500 !bg-amber-500 !text-black">Создать объявление</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
