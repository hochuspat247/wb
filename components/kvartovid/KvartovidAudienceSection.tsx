import { KVARTOVID_AUDIENCES } from "@/lib/kvartovid/constants";

export function KvartovidAudienceSection() {
  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16" id="audience">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Для кого КвартоВид</h2>
        <p className="mt-3 text-muted">
          Риэлторам, арендодателям и всем, кто хочет продать или сдать квартиру быстрее — без слабого первого фото и пустого текста.
        </p>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-container border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {KVARTOVID_AUDIENCES.map(([title, scenario]) => (
          <div className="min-h-40 bg-[#0a1210] p-6 transition hover:bg-amber-500/5" key={title}>
            <p className="text-xl font-bold leading-tight text-ink">{title}</p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-muted">{scenario}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
