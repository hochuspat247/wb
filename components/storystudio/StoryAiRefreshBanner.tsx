"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

type StoryAiRefreshBannerProps = {
  loading?: boolean;
  onRefresh: () => void;
};

export function StoryAiRefreshBanner({ loading = false, onRefresh }: StoryAiRefreshBannerProps) {
  return (
    <div className="rounded-card border border-cyan/30 bg-cyan/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-cyan">
            <RefreshCw className="h-4 w-4" />
            Данные истории изменились
          </p>
          <p className="mt-1 text-sm text-muted">
            Вы отредактировали поля проекта. Обновите данные для ИИ — тогда новые главы и персонажи будут опираться на
            ваши правки, а не на старую версию.
          </p>
        </div>
        <Button
          type="button"
          className="w-full shrink-0 !border-violet !bg-violet !text-white sm:w-auto"
          disabled={loading}
          onClick={onRefresh}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Обновляем...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Обновить данные для ИИ
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
