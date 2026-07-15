"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/branding";

const links = [
  ["Видео-сцены", "/storystudio#video-series"],
  ["Карта связей", "/storystudio#relations"],
  ["Пример", "/storystudio#sample"],
  ["Тарифы", "/storystudio#pricing"],
  ["Создать", "/storystudio/create"],
  ["Кабинет", "/storystudio/cabinet"]
] as const;

export function StoryStudioHeader() {
  const { data: session, status } = useSession();
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-[rgba(212,180,131,0.18)] bg-[rgba(7,11,20,0.72)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/storystudio" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,180,131,0.35)] bg-[rgba(212,180,131,0.12)] text-gold shadow-[0_0_24px_rgba(212,180,131,0.25)] transition group-hover:scale-105">
            <MoonStar className="h-4 w-4" />
          </span>
          <span className="font-fairy text-xl font-semibold tracking-tight text-moon sm:text-2xl">
            {BRAND.storyStudio}
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-moon"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthed ? (
            <>
              <Link href="/storystudio/cabinet">
                <Button variant="secondary" size="sm">
                  Мои истории
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/storystudio" })}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login?callbackUrl=/storystudio/cabinet">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/storystudio/create">
                <Button
                  size="sm"
                  className="!border-gold !bg-gold !text-[#1a140f] hover:!bg-[#e0c796]"
                >
                  Попробовать бесплатно
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-muted md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-[rgba(212,180,131,0.15)] bg-[rgba(7,11,20,0.96)] px-4 py-4 backdrop-blur-xl sm:max-h-[calc(100dvh-4rem)] md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-moon"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
              {isAuthed ? (
                <>
                  <Link href="/storystudio/cabinet" onClick={() => setMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Мои истории
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut({ callbackUrl: "/storystudio" });
                    }}
                  >
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login?callbackUrl=/storystudio/cabinet" onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Войти
                    </Button>
                  </Link>
                  <Link href="/storystudio/create" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full !border-gold !bg-gold !text-[#1a140f]">Попробовать бесплатно</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
