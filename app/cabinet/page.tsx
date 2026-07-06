import type { Metadata } from "next";
import { CabinetApp } from "@/components/cabinet/CabinetApp";

export const metadata: Metadata = {
  title: "Личный кабинет — MarketCard AI",
  description: "Ваши сохранённые карточки товаров, статистика и настройки."
};

export default function CabinetPage() {
  return <CabinetApp />;
}
