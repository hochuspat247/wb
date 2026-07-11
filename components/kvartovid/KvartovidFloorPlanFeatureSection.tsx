"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KvartovidFloorPlanEditor } from "@/components/kvartovid/KvartovidFloorPlanEditor";
import { KVARTOVID_FLOOR_PLAN_DEMO } from "@/lib/kvartovid/floorPlanDemo";
import { FLOOR_PLAN_DISCLAIMER } from "@/lib/kvartovid/floorPlanRender";
import type { KvartovidFloorPlanLayout } from "@/types/kvartovid";

const FEATURE_POINTS = [
  "ИИ собирает черновик по параметрам квартиры",
  "Тяните стены и комнаты как в онлайн-конструкторе",
  "Меняйте названия, метры и удаляйте лишние зоны",
  "Скачивайте SVG или PNG в платной версии после генерации объявления"
] as const;

export function KvartovidFloorPlanFeatureSection() {
  const [demoLayout, setDemoLayout] = useState<KvartovidFloorPlanLayout>(KVARTOVID_FLOOR_PLAN_DEMO);

  return (
    <section id="floor-plan-feature" className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-16">
      <div className="overflow-hidden rounded-container border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-[#0a1210] to-amber-500/10">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:p-12">
          <div className="text-center lg:sticky lg:top-28 lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <LayoutGrid className="h-3.5 w-3.5" />
              Интерактивная планировка
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl lg:text-4xl">Конструктор схемы квартиры</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Не просто картинка от ИИ — живая схема, которую можно подправить под реальную планировку перед
              публикацией на Циан и Авито.
            </p>

            <ul className="mt-6 space-y-2.5 text-left text-sm text-muted">
              {FEATURE_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/kvartovid/create" className="w-full sm:w-auto lg:w-full">
                <Button size="lg" className="w-full !border-emerald-500 !bg-emerald-500 !text-black hover:!bg-emerald-400">
                  Собрать планировку
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-muted">Попробуйте прямо здесь — демо ниже можно редактировать</p>
            </div>
          </div>

          <div className="min-w-0 rounded-card border border-white/10 bg-[#060d0b]/50 p-4 sm:p-5">
            <KvartovidFloorPlanEditor
              layout={demoLayout}
              showExportPreview={false}
              onChange={({ layout }) => setDemoLayout(layout)}
            />
            <p className="mt-3 text-xs text-muted">{FLOOR_PLAN_DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
