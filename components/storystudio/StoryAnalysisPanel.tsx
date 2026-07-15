"use client";

import { useState } from "react";
import { Check, Heart, Loader2, Sparkles, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { analyzeStory, updateStoryProject } from "@/lib/api/storystudio";
import type { StoryAnalysisRemark, StoryProject } from "@/types/storystudio";

type Props = {
  story: StoryProject;
  onUpdate: (story: StoryProject) => void;
  onError: (message: string) => void;
  applyQuota: (quota: unknown) => void;
};

const severityMeta = {
  critical: {
    label: "Что мешает",
    icon: TriangleAlert,
    className: "border-rose-500/30 bg-rose-500/10 text-rose-100"
  },
  attention: {
    label: "Что улучшить и добавить",
    icon: Sparkles,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-50"
  },
  good: {
    label: "Что уже работает",
    icon: Heart,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-50"
  }
} as const;

export function StoryAnalysisPanel({ story, onUpdate, onError, applyQuota }: Props) {
  const [focus, setFocus] = useState("");
  const [showFocus, setShowFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const analysis = story.analysis;
  const chapterCount = story.chapters.length;

  async function handleRun() {
    setLoading(true);
    onError("");
    try {
      const { story: updated, quota } = await analyzeStory(story.id, focus);
      onUpdate(updated);
      applyQuota(quota);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Не удалось запустить анализ");
    } finally {
      setLoading(false);
    }
  }

  async function setRemarkStatus(remarkId: string, status: StoryAnalysisRemark["status"]) {
    if (!story.analysis) return;
    setSavingId(remarkId);
    onError("");

    const nextAnalysis = {
      ...story.analysis,
      remarks: story.analysis.remarks.map((remark) =>
        remark.id === remarkId ? { ...remark, status } : remark
      )
    };

    const nextStory: StoryProject = {
      ...story,
      analysis: nextAnalysis,
      updatedAt: new Date().toISOString()
    };

    onUpdate(nextStory);
    try {
      await updateStoryProject(nextStory);
    } catch {
      onError("Не удалось сохранить решение по замечанию");
    } finally {
      setSavingId(null);
    }
  }

  const groups = (["good", "attention", "critical"] as const).map((severity) => ({
    severity,
    ...severityMeta[severity],
    items: analysis?.remarks.filter((r) => r.severity === severity) ?? []
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-white/10 bg-card p-5">
        <h2 className="text-lg font-semibold text-ink">Анализ произведения</h2>
        <p className="mt-1 text-sm text-muted">
          ИИ читает вашу текущую историю
          {chapterCount > 0 ? ` (${chapterCount} гл.)` : " (основу и персонажей)"} и подскажет: что
          уже получается, что доработать и что можно добавить дальше.
        </p>

        <Button
          type="button"
          className="mt-4 !border-violet !bg-violet !text-white"
          disabled={loading}
          onClick={handleRun}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {analysis ? "Обновить анализ" : "Проанализировать историю"}
        </Button>

        <button
          type="button"
          className="mt-3 block text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={() => setShowFocus((v) => !v)}
        >
          {showFocus ? "Скрыть акцент" : "Уточнить акцент (необязательно)"}
        </button>

        {showFocus && (
          <Textarea
            className="mt-3"
            rows={2}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Например: мотивация героя, темп сцены, чем закончить главу…"
          />
        )}
      </div>

      {!analysis ? (
        <div className="rounded-card border border-dashed border-white/15 p-8 text-center text-sm text-muted">
          Нажмите «Проанализировать историю» — разберём то, что уже написано.
        </div>
      ) : (
        <>
          <div className="rounded-card border border-violet/25 bg-violet/10 p-5">
            <p className="text-sm leading-relaxed text-ink">{analysis.summary}</p>
            {analysis.focus && (
              <p className="mt-2 text-xs text-muted">Акцент: {analysis.focus}</p>
            )}
          </div>

          {groups.map((group) =>
            group.items.length ? (
              <section key={group.severity} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
                  <group.icon className="h-4 w-4" />
                  {group.label}
                </h3>
                {group.items.map((remark) => (
                  <div
                    key={remark.id}
                    className={`rounded-card border p-4 ${group.className} ${
                      remark.status !== "pending" ? "opacity-80" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-ink">{remark.title}</h4>
                        <p className="mt-1 text-sm text-ink/90">{remark.detail}</p>
                        {remark.suggestion && (
                          <p className="mt-2 text-sm text-ink/80">→ {remark.suggestion}</p>
                        )}
                      </div>
                      {remark.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={savingId === remark.id}
                            onClick={() => setRemarkStatus(remark.id, "applied")}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Учтено
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={savingId === remark.id}
                            onClick={() => setRemarkStatus(remark.id, "dismissed")}
                          >
                            <X className="h-3.5 w-3.5" />
                            Скрыть
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs uppercase tracking-wide text-muted">
                          {remark.status === "applied" ? "Учтено" : "Скрыто"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            ) : null
          )}
        </>
      )}
    </div>
  );
}
