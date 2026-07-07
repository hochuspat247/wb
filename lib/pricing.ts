export const FREE_TRIAL_CARDS = 3;

export type GenerationPackage = {
  id: string;
  count: number;
  label: string;
  description: string;
};

export const GENERATION_PACKAGES: GenerationPackage[] = [
  {
    id: "single",
    count: 1,
    label: "1 фото",
    description: "Разовая генерация обложки"
  },
  {
    id: "pack10",
    count: 10,
    label: "10 фото",
    description: "Для теста гипотез и новых SKU"
  },
  {
    id: "pack100",
    count: 100,
    label: "100 фото",
    description: "Для активного каталога"
  }
];

const BASE_PRICE_PER_UNIT = 149;
const PACKAGE_TOTAL_OVERRIDES: Record<number, number> = {
  5: 490,
  20: 1490
};

export function calculatePackagePrice(count: number) {
  const fixedTotal = PACKAGE_TOTAL_OVERRIDES[count];
  if (fixedTotal) {
    const pricePerUnit = fixedTotal / count;

    return {
      count,
      pricePerUnit,
      total: fixedTotal,
      savingsPercent: Math.round((1 - pricePerUnit / BASE_PRICE_PER_UNIT) * 100)
    };
  }

  const discount = count >= 100 ? 0.52 : count >= 10 ? 0.68 : count >= 5 ? 0.78 : 1;
  const pricePerUnit = Math.max(49, Math.round(BASE_PRICE_PER_UNIT * discount));
  const total = pricePerUnit * count;

  return {
    count,
    pricePerUnit,
    total,
    savingsPercent: Math.round((1 - discount) * 100)
  };
}

export function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}
