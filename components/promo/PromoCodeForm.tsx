"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AdminProductId } from "@/lib/admin/products";
import { ADMIN_PRODUCTS } from "@/lib/admin/products";
import { PromoApiError, redeemPromoCode } from "@/lib/api/promo";

type Props = {
  product: AdminProductId;
  onSuccess?: (result: Awaited<ReturnType<typeof redeemPromoCode>>) => void;
  className?: string;
  compact?: boolean;
};

export function PromoCodeForm({ product, onSuccess, className = "", compact = false }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await redeemPromoCode(code, product);
      setMessage(`Промокод активирован: +${result.creditsGranted} генерация.`);
      setCode("");
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof PromoApiError ? err.message : "Не удалось активировать промокод.");
    } finally {
      setLoading(false);
    }
  }

  const productLabel = ADMIN_PRODUCTS[product].shortLabel;

  if (compact) {
    return (
      <form className={`flex flex-col gap-2 sm:flex-row sm:items-end ${className}`.trim()} onSubmit={handleSubmit}>
        <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-semibold text-ink">
          Промокод
          <Input
            autoComplete="off"
            disabled={loading}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="XX-XXXX-XXXX"
            spellCheck={false}
            value={code}
          />
        </label>
        <Button disabled={loading || !code.trim()} size="sm" type="submit">
          {loading ? "…" : "Активировать"}
        </Button>
        {error ? <p className="text-sm text-red-400 sm:basis-full">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400 sm:basis-full">{message}</p> : null}
      </form>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-ink">Промокод</h3>
          <p className="mt-1 text-sm text-muted">
            Компенсационный код для {productLabel}. Одноразовый, привязан к вашему email.
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <Input
              autoComplete="off"
              disabled={loading}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="XX-XXXX-XXXX"
              spellCheck={false}
              value={code}
            />
            <Button disabled={loading || !code.trim()} size="sm" type="submit">
              {loading ? "Активация…" : "Активировать промокод"}
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
