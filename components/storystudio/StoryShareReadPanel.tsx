"use client";

import { useState } from "react";
import { BookOpen, Check, Copy, Link2, Loader2, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StoryReaderView } from "@/components/storystudio/StoryReaderView";
import { setStoryShare } from "@/lib/api/storystudio";
import { printStorySheet } from "@/lib/storystudio/printStory";
import type { StoryProject } from "@/types/storystudio";

type Props = {
  story: StoryProject;
  onUpdate: (story: StoryProject) => void;
  onError: (message: string) => void;
};

export function StoryShareReadPanel({ story, onUpdate, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReader, setShowReader] = useState(true);

  const sharePath = story.shareId ? `/storystudio/s/${story.shareId}` : null;
  const shareUrl =
    typeof window !== "undefined" && sharePath ? `${window.location.origin}${sharePath}` : sharePath;

  async function toggleShare(nextPublic: boolean) {
    setLoading(true);
    onError("");
    try {
      const { story: updated } = await setStoryShare(story.id, nextPublic);
      onUpdate(updated);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Не удалось обновить доступ");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onError("Не удалось скопировать ссылку");
    }
  }

  function handlePrint() {
    setShowReader(true);
    window.setTimeout(() => printStorySheet(), 80);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-white/10 bg-card p-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Share2 className="h-5 w-5 text-violet" />
              Поделиться и читать
            </h2>
            <p className="mt-1 text-sm text-muted">
              Откройте доступ по ссылке, читайте на экране или сохраните фирменный PDF через печать.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowReader((v) => !v)}
            >
              <BookOpen className="h-4 w-4" />
              {showReader ? "Скрыть чтение" : "Режим чтения"}
            </Button>
            <Button type="button" variant="secondary" onClick={handlePrint} className="print:hidden">
              <Printer className="h-4 w-4" />
              Печать / PDF
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted print:hidden">
          Для PDF: поля «По умолчанию», включите «Фоновые цвета», отключите колонтитулы браузера.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="!border-violet !bg-violet !text-white"
            disabled={loading}
            onClick={() => toggleShare(!story.isPublic)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {story.isPublic ? "Закрыть доступ" : "Открыть доступ по ссылке"}
          </Button>
          {story.isPublic && shareUrl && (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-xs text-muted">{shareUrl}</code>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 text-violet hover:text-ink"
                aria-label="Скопировать ссылку"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {showReader && (
        <div className="story-print-root story-print-screen-wrap rounded-card border border-[rgba(212,180,131,0.22)] p-4 sm:p-6 print:border-0 print:bg-transparent print:p-0">
          <StoryReaderView story={story} />
        </div>
      )}
    </div>
  );
}
