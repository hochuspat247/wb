"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const links = [
  ["Видео-серии", "/storystudio#video-series"],
  ["Возможности", "/storystudio#features"],
  ["Примеры", "/storystudio#examples"],
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
        scrolled ? "border-b border-white/10 bg-[#0a0812]/90 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
        <Link href="/storystudio" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet/20 text-violet">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">
            Story<span className="text-violet">Studio</span>
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
                <Button size="sm" className="!bg-violet !text-white !border-violet hover:!bg-[#9d8bff]">
                  Создать историю
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
        <div className="border-t border-white/10 bg-[#0a0812] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link href="/storystudio/create" onClick={() => setMenuOpen(false)}>
              <Button className="mt-2 w-full !bg-violet !text-white !border-violet">Создать историю</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
