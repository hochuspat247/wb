"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { focusHeroMiniGenerator } from "@/lib/hero/focusMiniGenerator";
import type { MetrikaGoal } from "@/lib/metrika";

const links = [
  ["Как работает", "/#how-it-works"],
  ["Примеры", "/#examples"],
  ["Сравнение", "/#compare"],
  ["Тарифы", "/#pricing"],
  ["FAQ", "/#faq"]
] as const;

const NAV_LINK_GOALS: Record<string, MetrikaGoal> = {
  "/#how-it-works": "compare_view",
  "/#examples": "examples_click",
  "/#compare": "compare_view",
  "/#pricing": "pricing_click",
  "/#faq": "faq_view"
};

function trackNavClick(href: string, source: "header" | "mobile") {
  const goal = NAV_LINK_GOALS[href];
  if (goal) {
    trackMarketingEvent(goal, { source });
  }

  if (href === "/cabinet#create") {
    trackMarketingEvent("click_create_card", { source });
  }
}

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

  function trackCreateCardClick(source: "header" | "mobile" = "header") {
    trackMarketingEvent("click_create_card", { source });
  }

  function handleTryFreeClick(event: React.MouseEvent) {
    event.preventDefault();
    trackMarketingEvent("header_try_click");
    focusHeroMiniGenerator({ openFilePicker: true });
    setMenuOpen(false);
    window.history.replaceState(null, "", "#hero-mini-generator");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-clay bg-card/92 shadow-[0_10px_30px_rgba(28,28,28,0.04)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="section-shell flex min-h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              className="wow-link px-3 py-2 text-sm font-semibold text-muted hover:text-ink"
              href={href}
              key={href}
              onClick={() => trackNavClick(href, "header")}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthed ? (
            <>
              <Link href="/cabinet" onClick={() => trackCreateCardClick("header")}>
                <Button variant="ghost">{session?.user?.name || "Кабинет"}</Button>
              </Link>
              <Link href="/cabinet#create" onClick={() => trackCreateCardClick("header")}>
                <Button>Попробовать бесплатно</Button>
              </Link>
              <Button onClick={() => signOut({ callbackUrl: "/" })} variant="secondary">
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/register">
                <Button variant="ghost">Регистрация</Button>
              </Link>
              <Button onClick={handleTryFreeClick} type="button">
                Попробовать бесплатно
              </Button>
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
                onClick={() => {
                  trackNavClick(href, "mobile");
                  setMenuOpen(false);
                }}
              >
                {label}
              </Link>
            ))}
            <div className="mt-4 grid gap-2 border-t border-clay pt-4">
              {isAuthed ? (
                <>
                  <Link
                    href="/cabinet"
                    onClick={() => {
                      trackCreateCardClick("mobile");
                      setMenuOpen(false);
                    }}
                  >
                    <Button className="w-full" variant="secondary">
                      Кабинет
                    </Button>
                  </Link>
                  <Link
                    href="/cabinet#create"
                    onClick={() => {
                      trackCreateCardClick("mobile");
                      setMenuOpen(false);
                    }}
                  >
                    <Button className="w-full">Создать карточку</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full" variant="secondary">
                      Регистрация
                    </Button>
                  </Link>
                  <Button className="w-full" onClick={handleTryFreeClick} type="button">
                    Попробовать бесплатно
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
