import { ExampleCard } from "@/components/ui/ExampleCard";

export const exampleProducts = [
  {
    id: "water-tester",
    title: "Тестер качества воды",
    subtitle: "TDS-метр",
    theme: {
      bg: "bg-[radial-gradient(circle_at_20%_10%,#7aa6aa_0%,#24444a_38%,#111111_100%)]",
      accent: "bg-accent",
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
      bg: "bg-[radial-gradient(circle_at_18%_16%,#f1c8b7_0%,#8f4a3c_40%,#111111_100%)]",
      accent: "bg-[#c46b4e]",
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
      bg: "bg-[radial-gradient(circle_at_20%_12%,#d7e3e6_0%,#53656d_42%,#111111_100%)]",
      accent: "bg-[#5f7780]",
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
      bg: "bg-[radial-gradient(circle_at_25%_10%,#d8e5c8_0%,#60724f_42%,#111111_100%)]",
      accent: "bg-[#6e8054]",
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
      bg: "bg-[radial-gradient(circle_at_20%_12%,#e7c18a_0%,#6d4527_42%,#111111_100%)]",
      accent: "bg-[#a96d2c]",
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
      bg: "bg-[radial-gradient(circle_at_18%_12%,#f2efe6_0%,#9d9281_40%,#111111_100%)]",
      accent: "bg-[#786b5c]",
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
