"use client";

import type { ReactNode } from "react";
import { LogOut, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProductSwitcher } from "@/components/admin/AdminProductSwitcher";
import { Button } from "@/components/ui/Button";
import type { AdminProduct, AdminProductId } from "@/lib/admin/products";

type Props = {
  product: AdminProduct;
  onProductChange: (product: AdminProductId) => void;
  onRefresh: () => void;
  children: ReactNode;
};

export function AdminShell({ product, onProductChange, onRefresh, children }: Props) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  async function handleGptExport(format: "markdown" | "json") {
    setExporting(true);

    try {
      const response = await fetch(`/api/admin/export?format=${format}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Не удалось выгрузить отчёт");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `admin-gpt-export.${format === "markdown" ? "md" : "json"}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Не удалось выгрузить отчёт для GPT. Попробуйте ещё раз.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-clay bg-card/90 px-4 py-4 backdrop-blur-xl sm:px-5 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-accent sm:text-xs sm:tracking-[0.18em]">
                Admin · {product.shortLabel}
              </p>
              <h1 className="mt-1 text-xl font-black leading-tight text-ink sm:text-2xl">{product.title}</h1>
              <p className="mt-1 text-sm text-muted">{product.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminProductSwitcher value={product.id} onChange={onProductChange} />
              <Button disabled={exporting} onClick={() => void handleGptExport("markdown")} size="sm" variant="secondary">
                <Download size={16} />
                {exporting ? "Выгрузка…" : "Для GPT"}
              </Button>
              <Button onClick={onRefresh} size="sm" variant="secondary">
                <RefreshCw size={16} />
                Обновить
              </Button>
              <Button
                onClick={async () => {
                  await fetch("/api/admin/login", { method: "DELETE" });
                  router.push("/admin/login");
                }}
                size="sm"
                variant="ghost"
              >
                <LogOut size={16} />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-5 lg:space-y-6 lg:p-8">{children}</main>
    </div>
  );
}
