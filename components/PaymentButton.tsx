"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { Button } from "@/components/ui/Button";
import { createPayment } from "@/lib/api/user";

type PaymentButtonProps = {
  count: number;
  children: ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "dark";
};

export function PaymentButton({
  count,
  children,
  className,
  size,
  variant
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      trackConversion("payment_click", { package: count });
      const payment = await createPayment(count);
      window.location.assign(payment.confirmationUrl);
    } catch (paymentError) {
      if (paymentError instanceof Error && paymentError.message === "UNAUTHORIZED") {
        window.location.assign(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      setError("Не удалось создать платеж. Попробуйте еще раз.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button className="w-full" disabled={loading} onClick={handleClick} size={size} type="button" variant={variant}>
        {loading ? "Переходим к оплате..." : children}
      </Button>
      {error ? <p className="mt-2 text-xs font-semibold text-red-300">{error}</p> : null}
    </div>
  );
}
