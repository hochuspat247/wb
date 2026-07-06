const stats = [
  ["1", "тестовая карточка бесплатно"],
  ["~2 мин", "на генерацию"],
  ["PNG + JSON", "экспорт"],
  ["WB / Ozon / Avito / Яндекс Маркет", "для площадок"]
];

export function TrustBar() {
  return (
    <section className="pb-12">
      <div className="section-shell">
        <div className="grid overflow-hidden rounded-[22px] border border-clay bg-card/72 backdrop-blur md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div className="border-clay px-5 py-5 md:border-r md:last:border-r-0" key={value}>
              <p className="text-lg font-black leading-tight text-ink sm:text-xl">{value}</p>
              <p className="mt-2 text-sm font-semibold text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
