"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { ADMIN_PRODUCT_LIST, type AdminProductId } from "@/lib/admin/products";
import {
  AdminPromoApiError,
  createAdminPromoCode,
  fetchAdminPromoCodes,
  revokeAdminPromoCode
} from "@/lib/api/adminPromo";
import type { PromoCodeRecord } from "@/types/promo";

function formatPromoDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function productLabel(product: AdminProductId) {
  return ADMIN_PRODUCT_LIST.find((item) => item.id === product)?.shortLabel ?? product;
}

export function PromoCodesPanel() {
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [product, setProduct] = useState<AdminProductId>("marketcard");
  const [note, setNote] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "redeemed">("");
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const items = await fetchAdminPromoCodes({
        status: filterStatus || undefined
      });
      setCodes(items);
    } catch (err) {
      setError(err instanceof AdminPromoApiError ? err.message : "Не удалось загрузить промокоды.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    setLastCreatedCode(null);

    try {
      const promo = await createAdminPromoCode({
        assignedEmail,
        product,
        note: note.trim() || undefined
      });
      setSuccess(`Промокод создан: ${promo.code}`);
      setLastCreatedCode(promo.code);
      setAssignedEmail("");
      setNote("");
      await loadCodes();
    } catch (err) {
      setError(err instanceof AdminPromoApiError ? err.message : "Не удалось создать промокод.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess(`Скопировано: ${code}`);
    } catch {
      setError("Не удалось скопировать код.");
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setError("");
    setSuccess("");

    try {
      await revokeAdminPromoCode(id);
      setSuccess("Промокод удалён.");
      await loadCodes();
    } catch (err) {
      setError(err instanceof AdminPromoApiError ? err.message : "Не удалось удалить промокод.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form className="grid gap-4 rounded-card border border-clay bg-paper/40 p-4 lg:grid-cols-2" onSubmit={handleCreate}>
        <label className="grid gap-2 text-sm font-semibold text-ink lg:col-span-2">
          Email пользователя
          <Input
            disabled={creating}
            onChange={(event) => setAssignedEmail(event.target.value)}
            placeholder="user@example.com"
            required
            type="email"
            value={assignedEmail}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          Сервис
          <Select disabled={creating} onChange={(event) => setProduct(event.target.value as AdminProductId)} value={product}>
            {ADMIN_PRODUCT_LIST.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-ink">
          Заметка (необязательно)
          <Input
            disabled={creating}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Компенсация за ошибку генерации"
            value={note}
          />
        </label>

        <div className="lg:col-span-2">
          <p className="text-sm text-muted">
            Выдаётся минимальный тариф: 1 генерация без оплаты. Код одноразовый и работает только у указанного
            пользователя.
          </p>
          <Button className="mt-4" disabled={creating || !assignedEmail.trim()} type="submit">
            {creating ? "Создание…" : "Сгенерировать промокод"}
          </Button>
        </div>
      </form>

      {error ? <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</p> : null}

      {lastCreatedCode ? (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-accent/30 bg-accent/10 px-4 py-3">
          <Ticket className="h-5 w-5 text-accent" />
          <code className="text-lg font-bold tracking-wider text-ink">{lastCreatedCode}</code>
          <Button onClick={() => void handleCopy(lastCreatedCode)} size="sm" type="button" variant="secondary">
            <Copy className="h-4 w-4" />
            Копировать
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Последние промокоды</h3>
        <Select
          className="max-w-[220px]"
          onChange={(event) => setFilterStatus(event.target.value as "" | "active" | "redeemed")}
          value={filterStatus}
        >
          <option value="">Все</option>
          <option value="active">Активные</option>
          <option value="redeemed">Использованные</option>
        </Select>
      </div>

      {loading ? (
        <Loader />
      ) : codes.length === 0 ? (
        <p className="text-sm text-muted">Промокодов пока нет.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-clay">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-clay bg-paper/50 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Сервис</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Создан</th>
                <th className="px-4 py-3">Использован</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((item) => (
                <tr className="border-b border-clay/60 last:border-0" key={item.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-ink">{item.code}</td>
                  <td className="px-4 py-3 text-muted">{item.assignedEmail}</td>
                  <td className="px-4 py-3">{productLabel(item.product)}</td>
                  <td className="px-4 py-3">
                    {item.status === "redeemed" ? (
                      <span className="text-emerald-400">Использован</span>
                    ) : (
                      <span className="text-amber-400">Активен</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatPromoDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-muted">{formatPromoDate(item.redeemedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button onClick={() => void handleCopy(item.code)} size="sm" type="button" variant="secondary">
                        <Copy className="h-4 w-4" />
                      </Button>
                      {item.status === "active" ? (
                        <Button
                          disabled={revokingId === item.id}
                          onClick={() => void handleRevoke(item.id)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
