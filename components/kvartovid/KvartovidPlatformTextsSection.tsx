"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KVARTOVID_PLATFORMS } from "@/lib/kvartovid/constants";
import type { KvartovidPlatformId, KvartovidPlatformText } from "@/types/kvartovid";

type KvartovidPlatformTextsSectionProps = {
  platformTexts: KvartovidPlatformText[];
};

export function KvartovidPlatformTextsSection({ platformTexts }: KvartovidPlatformTextsSectionProps) {
  const [activePlatform, setActivePlatform] = useState<KvartovidPlatformId>("avito");
  const [copiedPlatform, setCopiedPlatform] = useState<KvartovidPlatformId | null>(null);

  const active = platformTexts.find((item) => item.platform === activePlatform) ?? platformTexts[0];
  const activeHint = KVARTOVID_PLATFORMS.find((item) => item.id === activePlatform)?.hint;

  async function copyPlatformText(item: KvartovidPlatformText) {
    const text = [item.title, "", item.description].join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(item.platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }

  if (!active) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Тексты под площадки</p>
        <Button type="button" size="sm" variant="secondary" onClick={() => copyPlatformText(active)}>
          <Copy className="h-3.5 w-3.5" />
          {copiedPlatform === active.platform ? "Скопировано" : `Копировать ${active.label}`}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {platformTexts.map((item) => (
          <button
            key={item.platform}
            type="button"
            onClick={() => setActivePlatform(item.platform)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              activePlatform === item.platform
                ? "border-amber-500 bg-amber-500/15 text-amber-300"
                : "border-white/15 text-muted hover:border-amber-500/30"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeHint ? <p className="mt-3 text-xs text-muted">{activeHint}</p> : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-[#0a1210]/80 p-4">
        <p className="text-sm font-bold text-ink">{active.title}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{active.description}</p>
      </div>
    </div>
  );
}
