import { GENERATION_TIME_COPY, describeFreeQuotaMarketing } from "@/lib/pricing";

const stats = [
  ["1 демо без входа", ""],
  [GENERATION_TIME_COPY, ""],
  [describeFreeQuotaMarketing(), ""],
  ["Серия для 1 товара", "в платном комплекте"]
];

export function TrustBar() {
  return (
    <section className="pb-12">
      <div className="section-shell">
        <div className="grid overflow-hidden rounded-[22px] border border-clay bg-card/72 backdrop-blur md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div className="border-clay px-5 py-5 md:border-r md:last:border-r-0" key={value}>
              <p className="text-base font-black leading-tight text-ink sm:text-lg">{value}</p>
              {label ? <p className="mt-2 text-sm font-semibold text-muted">{label}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
