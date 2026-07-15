"use client";

import Link from "next/link";
import { Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { STORY_PACKAGES } from "@/lib/storystudio/pricing";

type StoryPremiumUpsellBannerProps = {
  variant?: "inline" | "card";
  onOpenPricing?: () => void;
};

export function StoryPremiumUpsellBanner({ variant = "card", onOpenPricing }: StoryPremiumUpsellBannerProps) {
  const authorPackage = STORY_PACKAGES.find((pkg) => pkg.id === "author");

  if (variant === "inline") {
    return (
      <p className="rounded-xl border border-violet/30 bg-violet/10 px-4 py-3 text-sm text-muted">
        <Sparkles className="mr-1.5 inline h-4 w-4 text-violet" />
        Режим <strong className="text-ink">18+</strong> доступен только с пакетом «{authorPackage?.label ?? "Автор"}» или
        выше.{" "}
        {onOpenPricing ? (
          <button type="button" onClick={onOpenPricing} className="text-violet underline hover:no-underline">
            Оформить премиум
          </button>
        ) : (
          <Link href="/storystudio/cabinet#pricing" className="text-violet underline hover:no-underline">
            Оформить премиум
          </Link>
        )}
      </p>
    );
  }

  return (
    <div className="rounded-card border border-violet/40 bg-gradient-to-br from-violet/15 to-[#0d0a18] p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-violet/20 p-2">
          <Sparkles className="h-5 w-5 text-violet" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">Premium — сильнее сюжет и 18+</h3>
          <p className="mt-1 text-sm text-muted">
            Premium сильнее держит сюжет, глубже прорабатывает мир и героев и открывает 18+. Доступен с пакетом «
            {authorPackage?.label ?? "Автор"}» (50 генераций) или «Студия».
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onOpenPricing ? (
              <Button
                type="button"
                size="sm"
                className="!border-violet !bg-violet !text-white"
                onClick={onOpenPricing}
              >
                <Wallet className="h-4 w-4" />
                Оформить премиум
              </Button>
            ) : (
              <Link href="/storystudio/cabinet#pricing">
                <Button type="button" size="sm" className="!border-violet !bg-violet !text-white">
                  <Wallet className="h-4 w-4" />
                  Оформить премиум
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
