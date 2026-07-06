/** Декоративные мокапы для маркетинговых секций */

export function BeforePhotoMock({ label = "Фото с телефона" }: { label?: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-card bg-[#E8E4DE]">
        <div className="h-40 w-32 rounded-xl bg-gradient-to-br from-neutral-300 to-neutral-400" />
      </div>
      <p className="mt-3 text-center text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

export function AfterCardMock() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-gradient-to-br from-[#0c4a6e] via-[#134e4a] to-[#111111]">
      <div className="absolute left-4 top-4 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-ink">
        4:5
      </div>

      <div className="absolute left-4 top-12 max-w-[55%]">
        <p className="text-xl font-bold leading-tight text-white md:text-2xl">ТЕСТЕР</p>
        <p className="mt-1 inline-block rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
          КАЧЕСТВА ВОДЫ
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="h-32 w-11 rotate-3 rounded-xl bg-gradient-to-b from-neutral-100 to-neutral-300 shadow-2xl" />
      </div>

      <div className="absolute bottom-4 right-4 space-y-1.5">
        {["Контроль солей", "Термометр", "Проводимость"].map((text) => (
          <div className="rounded-md bg-white/95 px-2.5 py-1 text-[9px] font-semibold text-ink shadow-sm" key={text}>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
