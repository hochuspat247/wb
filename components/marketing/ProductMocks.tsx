import type { ReactNode } from "react";

/** Декоративные мокапы для маркетинговых секций */

export function BeforePhotoMock({ label = "Фото с телефона" }: { label?: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#14141c]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="relative">
          <div className="h-44 w-[4.5rem] rounded-2xl bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
          <div className="absolute -bottom-1 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-black/50 blur-md" />
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-medium text-white/45">{label}</p>
    </div>
  );
}

export function AfterCardMock() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c4a6e] via-[#134e4a] to-[#0a0a0f]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(53,183,255,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(109,93,252,0.2),transparent_50%)]" />

      <div className="absolute left-4 top-4 rounded-md bg-amber-400 px-2.5 py-1 text-[10px] font-black tracking-wide text-ink">
        ПРЕМИУМ
      </div>

      <div className="absolute left-4 top-12 max-w-[55%]">
        <p className="text-xl font-black leading-tight text-white md:text-2xl">ТЕСТЕР</p>
        <p className="mt-1 inline-block rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
          КАЧЕСТВА ВОДЫ
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="h-32 w-11 rotate-6 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-300 shadow-2xl" />
      </div>

      <div className="absolute bottom-4 right-4 space-y-1.5">
        {["Контроль солей", "Термометр", "Проводимость"].map((text) => (
          <div
            className="rounded-lg border border-amber-300/30 bg-amber-400/95 px-2.5 py-1 text-[9px] font-bold text-ink shadow-sm"
            key={text}
          >
            {text}
          </div>
        ))}
      </div>

      <div className="absolute left-4 right-4 top-[42%] grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div className="aspect-square overflow-hidden rounded-lg border border-white/15 bg-white/10" key={n}>
            <div className="h-full w-full bg-gradient-to-br from-white/20 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

type CaseMockProps = {
  variant: "clothing" | "shoes" | "cosmetic" | "furniture" | "electronics" | "accessory";
};

export function CaseBeforeMock({ variant }: CaseMockProps) {
  const shapes: Record<CaseMockProps["variant"], ReactNode> = {
    clothing: <div className="h-40 w-32 rounded-lg bg-gradient-to-br from-stone-400 to-stone-600 shadow-xl" />,
    shoes: <div className="h-20 w-36 rounded-2xl bg-gradient-to-br from-zinc-400 to-zinc-600 shadow-xl" />,
    cosmetic: <div className="h-36 w-14 rounded-full bg-gradient-to-b from-rose-200 to-rose-400 shadow-xl" />,
    furniture: <div className="h-28 w-36 rounded-md bg-gradient-to-br from-amber-700 to-amber-900 shadow-xl" />,
    electronics: <div className="h-44 w-[4.5rem] rounded-2xl bg-gradient-to-b from-neutral-200 to-neutral-400 shadow-xl" />,
    accessory: <div className="h-8 w-40 rounded-full bg-gradient-to-r from-amber-700 to-amber-900 shadow-xl" />
  };

  return (
    <div className="flex h-full items-center justify-center bg-[#1a1a22]">
      {shapes[variant]}
    </div>
  );
}

export function CaseAfterMock({ variant }: CaseMockProps) {
  const themes: Record<CaseMockProps["variant"], string> = {
    clothing: "from-indigo-950 via-violet-950 to-ink",
    shoes: "from-orange-950 via-red-950 to-ink",
    cosmetic: "from-rose-950 via-pink-950 to-ink",
    furniture: "from-amber-950 via-orange-950 to-ink",
    electronics: "from-cyan-950 via-teal-950 to-ink",
    accessory: "from-yellow-950 via-amber-950 to-ink"
  };

  return (
    <div className={`relative h-full bg-gradient-to-br ${themes[variant]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(216,255,69,0.08),transparent_50%)]" />
      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-12 left-1/2 h-40 w-28 -translate-x-1/2 rounded-2xl bg-white/10 backdrop-blur-sm" />
      <div className="absolute left-4 top-4 rounded-lg bg-white/10 px-3 py-1 text-[10px] font-bold text-white/80 backdrop-blur">
        AI · 4:5
      </div>
    </div>
  );
}

export const categoryToVariant: Record<string, CaseMockProps["variant"]> = {
  Одежда: "clothing",
  Обувь: "shoes",
  Косметика: "cosmetic",
  Мебель: "furniture",
  Электроника: "electronics",
  Аксессуары: "accessory"
};
