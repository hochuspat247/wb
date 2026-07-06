import { CabinetApp } from "@/components/cabinet/CabinetApp";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Личный кабинет",
  description: "Ваши сохранённые карточки товаров, статистика и настройки.",
  path: "/cabinet",
  noIndex: true
});

export default function CabinetPage() {
  return <CabinetApp />;
}
