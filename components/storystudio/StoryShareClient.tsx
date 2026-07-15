"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Printer } from "lucide-react";
import { StoryStudioHeader } from "@/components/storystudio/StoryStudioHeader";
import { StoryStudioFooter } from "@/components/storystudio/StoryStudioFooter";
import { StoryReaderView } from "@/components/storystudio/StoryReaderView";
import { Button } from "@/components/ui/Button";
import { fetchSharedStory } from "@/lib/api/storystudio";
import { printStorySheet } from "@/lib/storystudio/printStory";
import type { StoryProject } from "@/types/storystudio";

type Props = {
  shareId: string;
};

export function StoryShareClient({ shareId }: Props) {
  const [story, setStory] = useState<StoryProject | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSharedStory(shareId)
      .then((data) => {
        if (!cancelled) setStory(data);
      })
      .catch(() => {
        if (!cancelled) setError("История не найдена или доступ закрыт.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <StoryStudioHeader />
      </div>

      <main className="mx-auto max-w-content px-4 pb-16 pt-24 sm:px-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : error || !story ? (
          <div className="story-fairy-panel mx-auto max-w-lg rounded-card p-8 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-gold" />
            <h1 className="story-fairy-title text-2xl text-moon">Не удалось открыть историю</h1>
            <p className="mt-2 text-sm text-muted">{error || "Ссылка недоступна."}</p>
            <Link href="/storystudio" className="mt-6 inline-block">
              <Button className="!border-gold !bg-gold !text-[#1a140f]">На главную СториСтудио</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <p className="text-sm text-muted">Публичная история · режим чтения</p>
                <p className="mt-1 text-xs text-muted">
                  Для PDF: поля «По умолчанию», включите «Фоновые цвета», отключите колонтитулы.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => printStorySheet()}>
                <Printer className="h-4 w-4" />
                Печать / PDF
              </Button>
            </div>
            <div className="story-print-root story-print-screen-wrap print:p-0">
              <StoryReaderView story={story} />
            </div>
            <div className="mt-8 text-center print:hidden">
              <Link href="/storystudio/create">
                <Button className="!border-gold !bg-gold !text-[#1a140f]">Создать свою историю</Button>
              </Link>
            </div>
          </>
        )}
      </main>

      <div className="print:hidden">
        <StoryStudioFooter />
      </div>
    </div>
  );
}
