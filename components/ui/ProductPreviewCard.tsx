import { ExampleCard } from "@/components/ui/ExampleCard";
import waterTesterBefore from "@/publick/92ceafd3-6bf3-4fa3-9442-27cdd6cc0038.png";
import waterTesterAfter from "@/publick/bdc93c3d-6c98-45de-bd5f-58f0e4618213.png";
import faceCreamBefore from "@/publick/f0081719-2140-4122-9896-3ad207466049.png";
import faceCreamAfter from "@/publick/8270a01e-bd48-4474-b18d-1a3b6eb2e6fc.png";
import steamerBefore from "@/publick/2f992b7f-7f3c-4871-95b5-252897d799cc.png";
import steamerAfter from "@/publick/b96119e8-f03b-43dc-8f66-c52a0b4ed245.png";
import fanBefore from "@/publick/70365542-46f3-4f0c-8bd0-92b2ee130c03.png";
import fanAfter from "@/publick/70a7dada-44df-4fe2-84bb-22290fbc0aa7.png";
import awardBefore from "@/publick/f5951788-06f3-44ef-8219-4eb442eaa4c9.png";
import awardAfter from "@/publick/7ab15fea-2529-4185-bd93-c8bfff5dee2e.png";
import organizerBefore from "@/publick/cdd81a98-547c-4670-9025-53ac18150abd.png";
import organizerAfter from "@/publick/09c69fe3-f845-439c-82c0-9722a6249992.png";

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
    images: {
      before: waterTesterBefore,
      after: waterTesterAfter
    },
    compareLabel: "Новая обложка",
    duration: "1–2 мин",
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
    images: {
      before: faceCreamBefore,
      after: faceCreamAfter
    },
    compareLabel: "Замена окружения",
    duration: "1–2 мин",
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
    images: {
      before: steamerBefore,
      after: steamerAfter
    },
    compareLabel: "Замена ракурса",
    duration: "1–2 мин",
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
    images: {
      before: fanBefore,
      after: fanAfter
    },
    compareLabel: "Премиум-инфографика",
    duration: "1–2 мин",
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
    images: {
      before: awardBefore,
      after: awardAfter
    },
    compareLabel: "Каталожный стиль",
    duration: "1–2 мин",
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
    images: {
      before: organizerBefore,
      after: organizerAfter
    },
    compareLabel: "Чистый фон",
    duration: "1–2 мин",
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
      compareLabel={product.compareLabel}
      duration={product.duration}
      images={product.images}
      subtitle={product.subtitle}
      theme={product.theme}
      title={product.title}
      variant={variant}
    />
  );
}
