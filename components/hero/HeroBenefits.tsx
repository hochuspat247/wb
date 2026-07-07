const benefits = [
  "1 демо без входа",
  "~60 сек до результата",
  "3 карточки после входа",
  "WB / Ozon / Avito / Яндекс Маркет"
];

export function HeroBenefits({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid gap-2 sm:grid-cols-2 ${className}`.trim()}>
      {benefits.map((item) => (
        <li className="flex items-start gap-2 text-sm font-semibold text-muted" key={item}>
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
