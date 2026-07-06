import { AfterCardMock } from "@/components/marketing/ProductMocks";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

const chips = [
  { label: "SEO готово", position: "left-[8%] top-[12%]" },
  { label: "Обложка 4:5", position: "right-[4%] top-[28%]" },
  { label: "PNG экспорт", position: "left-[6%] bottom-[22%]" },
  { label: "~2 мин", position: "right-[6%] bottom-[14%]" }
];

export function HeroStudioPreview() {
  return (
    <Reveal delay={2}>
      <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
        <div className="relative rounded-container border border-clay bg-card p-4 shadow-soft md:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-clay pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Studio preview</p>
            <Badge variant="outline">Результат сервиса</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.15fr_0.55fr]">
            <div className="relative overflow-hidden rounded-card transition duration-300 hover:scale-[1.01]">
              <AfterCardMock />
              {chips.slice(0, 2).map((chip) => (
                <span
                  className={`absolute z-10 rounded-full border border-clay bg-card px-3 py-1.5 text-[11px] font-semibold text-ink shadow-card ${chip.position}`}
                  key={chip.label}
                >
                  {chip.label}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-card border border-clay opacity-90 transition hover:opacity-100">
                <div className="aspect-[4/5] bg-gradient-to-br from-[#4a1942] via-[#7c2d6a] to-[#1a0a18] p-4">
                  <p className="text-sm font-bold text-white">Крем для лица</p>
                  <div className="mx-auto mt-8 h-20 w-10 rounded-full bg-gradient-to-b from-rose-100 to-rose-300" />
                </div>
              </div>
              <div className="overflow-hidden rounded-card border border-clay opacity-80 transition hover:opacity-100">
                <div className="aspect-[4/5] bg-gradient-to-br from-[#1e3a5f] to-[#111111] p-4">
                  <p className="text-sm font-bold text-white">Пароочиститель</p>
                  <div className="mx-auto mt-8 h-16 w-12 rounded-lg bg-neutral-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {chips.slice(2).map((chip) => (
              <span
                className="rounded-full border border-clay bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
                key={chip.label}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
