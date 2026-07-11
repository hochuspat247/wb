"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createKvartovidPayment } from "@/lib/api/kvartovid";
import type { KvartovidPaidPlanId } from "@/lib/kvartovid/pricing";

type KvartovidPaymentButtonProps = {
  planId: KvartovidPaidPlanId;
  children: ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "dark";
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function KvartovidPaymentButton({
  planId,
  children,
  className,
  size,
  variant = "primary"
}: KvartovidPaymentButtonProps) {
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
      const payment = await createKvartovidPayment(planId, emailRequired ? customerEmail.trim() : undefined);
      window.location.assign(payment.confirmationUrl);
    } catch (paymentError) {
      if (paymentError instanceof Error && paymentError.message === "UNAUTHORIZED") {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(`/register?callbackUrl=${encodeURIComponent(returnTo)}`);
        return;
      }

      if (paymentError instanceof Error && paymentError.message === "EMAIL_REQUIRED") {
        setEmailRequired(true);
        setError("Укажите email для чека.");
        return;
      }

      setError(paymentError instanceof Error ? paymentError.message : "Не удалось создать платёж.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
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
      <Button
        className={className}
        disabled={loading}
        onClick={handleClick}
        size={size}
        type="button"
        variant={variant}
      >
        {loading ? "Переход к оплате..." : emailRequired ? "Продолжить оплату" : children}
      </Button>
      {error ? <p className="mt-2 text-xs font-semibold text-red-300">{error}</p> : null}
    </div>
  );
}
