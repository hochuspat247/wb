import { Suspense } from "react";
import CabinetMetrikaGoal from "@/components/CabinetMetrikaGoal";
import { CabinetApp } from "@/components/cabinet/CabinetApp";
import { Loader } from "@/components/ui/Loader";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Личный кабинет",
  description: "Ваши сохранённые карточки товаров, статистика и настройки.",
  path: "/cabinet",
  noIndex: true
});

export default function CabinetPage() {
  return (
    <>
      <CabinetMetrikaGoal />
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper"><Loader label="Загружаем кабинет…" /></div>}>
        <CabinetApp />
      </Suspense>
    </>
  );
}
