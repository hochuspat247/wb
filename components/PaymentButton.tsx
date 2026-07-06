"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createPayment } from "@/lib/api/user";

type PaymentButtonProps = {
  count: number;
  children: ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "dark";
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function PaymentButton({
  count,
  children,
  className,
  size,
  variant
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailRequired, setEmailRequired] = useState(false);

  async function handleClick() {
    if (emailRequired && !isValidEmail(customerEmail.trim())) {
      setError("Укажите корректный email для чека.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      trackConversion("payment_click", { package: count });
      const payment = await createPayment(count, emailRequired ? customerEmail.trim() : undefined);
      window.location.assign(payment.confirmationUrl);
    } catch (paymentError) {
      if (paymentError instanceof Error && paymentError.message === "UNAUTHORIZED") {
        window.location.assign(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (paymentError instanceof Error && paymentError.message === "EMAIL_REQUIRED") {
        setEmailRequired(true);
        setError("Введите email, на него будет сформирован чек.");
        setLoading(false);
        return;
      }

      setError("Не удалось создать платеж. Попробуйте еще раз.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {emailRequired ? (
        <label className="mb-3 grid gap-2 text-xs font-semibold text-muted">
          Email для чека
          <Input
            autoComplete="email"
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={customerEmail}
          />
        </label>
      ) : null}
      <Button className="w-full" disabled={loading} onClick={handleClick} size={size} type="button" variant={variant}>
        {loading ? "Переходим к оплате..." : emailRequired ? "Продолжить оплату" : children}
      </Button>
      {error ? <p className="mt-2 text-xs font-semibold text-red-300">{error}</p> : null}
    </div>
  );
}
