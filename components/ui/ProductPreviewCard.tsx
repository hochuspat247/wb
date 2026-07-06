import { ExampleCard } from "@/components/ui/ExampleCard";

export const exampleProducts = [
  {
    id: "water-tester",
    title: "Тестер качества воды",
    subtitle: "TDS-метр",
    theme: {
      bg: "bg-gradient-to-br from-[#0c4a6e] via-[#134e4a] to-[#111111]",
      accent: "bg-orange-500",
      product: "bg-gradient-to-b from-neutral-100 to-neutral-300",
      label: "4:5"
    },
    badges: ["Контроль солей", "Термометр", "Проводимость"]
  },
  {
    id: "face-cream",
    title: "Крем для лица",
    subtitle: "Увлажнение 24ч",
    theme: {
      bg: "bg-gradient-to-br from-[#4a1942] via-[#7c2d6a] to-[#1a0a18]",
      accent: "bg-rose-400",
      product: "bg-gradient-to-b from-rose-100 to-rose-300 rounded-full",
      label: "Premium"
    },
    badges: ["SPF 30", "Гиалурон", "Без парабенов"]
  },
  {
    id: "steamer",
    title: "Пароочиститель",
    subtitle: "Для дома",
    theme: {
      bg: "bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#111111]",
      accent: "bg-sky-500",
      product: "bg-gradient-to-b from-neutral-200 to-neutral-400",
      label: "4:5"
    },
    badges: ["180°C", "2 л", "5 насадок"]
  },
  {
    id: "fan",
    title: "Вентилятор",
    subtitle: "Тихий режим",
    theme: {
      bg: "bg-gradient-to-br from-[#1a2e1a] via-[#2d4a2d] to-[#111111]",
      accent: "bg-emerald-500",
      product: "bg-gradient-to-b from-neutral-100 to-neutral-300 rounded-full",
      label: "4:5"
    },
    badges: ["3 скорости", "Пульт", "35 дБ"]
  },
  {
    id: "award",
    title: "Награда из дерева и акрила",
    subtitle: "Персонализация",
    theme: {
      bg: "bg-gradient-to-br from-[#3d2b1f] via-[#5c4033] to-[#1a1410]",
      accent: "bg-amber-500",
      product: "bg-gradient-to-b from-amber-200 to-amber-400",
      label: "Каталог"
    },
    badges: ["Гравировка", "Подарок", "Премиум"]
  },
  {
    id: "organizer",
    title: "Органайзер для косметики",
    subtitle: "Прозрачный",
    theme: {
      bg: "bg-gradient-to-br from-[#2d2d3a] via-[#4a4a5a] to-[#111111]",
      accent: "bg-violet-400",
      product: "bg-gradient-to-b from-white/40 to-white/20 backdrop-blur",
      label: "4:5"
    },
    badges: ["6 отделений", "Акрил", "Стекло"]
  }
] as const;

type ProductPreviewCardProps = {
  productId: (typeof exampleProducts)[number]["id"];
  variant?: "before" | "after";
};

export function ProductPreviewCard({ productId, variant = "after" }: ProductPreviewCardProps) {
  const product = exampleProducts.find((p) => p.id === productId) ?? exampleProducts[0];
  return (
    <ExampleCard
      badges={[...product.badges]}
      subtitle={product.subtitle}
      theme={product.theme}
      title={product.title}
      variant={variant}
    />
  );
}
