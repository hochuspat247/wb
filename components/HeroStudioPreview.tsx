import { AfterCardMock } from "@/components/marketing/ProductMocks";
import { Reveal } from "@/components/ui/Reveal";

const chips = [
  "Фото",
  "SEO",
  "Обложка",
  "Экспорт"
];

export function HeroStudioPreview() {
  return (
    <Reveal delay={2}>
      <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
        <div className="studio-noise relative overflow-hidden rounded-container border border-ink/10 bg-ink p-4 shadow-soft md:p-5">
          <div className="relative z-10 grid gap-4 md:grid-cols-[1fr_0.55fr]">
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 transition duration-300 hover:scale-[1.01]">
              <AfterCardMock />
              <span className="absolute left-4 top-4 rounded-full bg-mint px-3 py-1.5 text-xs font-black text-ink">
                4:5 marketplace
              </span>
              <span className="absolute bottom-4 right-4 rounded-full bg-card px-3 py-1.5 text-xs font-black text-ink">
                PNG готов
              </span>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">AI сборка</p>
                <div className="mt-5 space-y-3">
                  {chips.map((chip, index) => (
                    <div className="flex items-center gap-3" key={chip}>
                      <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${index === 3 ? "bg-mint text-ink" : "bg-white/10 text-white"}`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-white/85">{chip}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-2xl font-black text-white">~2</p>
                  <p className="mt-1 text-xs font-semibold text-white/50">минуты</p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-2xl font-black text-white">SEO</p>
                  <p className="mt-1 text-xs font-semibold text-white/50">готово</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
