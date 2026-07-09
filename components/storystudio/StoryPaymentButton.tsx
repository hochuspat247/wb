"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createStoryPayment } from "@/lib/api/storystudio";

type StoryPaymentButtonProps = {
  count: number;
  children: ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "dark";
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StoryPaymentButton({
  count,
  children,
  className,
  size,
  variant = "primary"
}: StoryPaymentButtonProps) {
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
      const payment = await createStoryPayment(count, emailRequired ? customerEmail.trim() : undefined);
      window.location.assign(payment.confirmationUrl);
    } catch (paymentError) {
      if (paymentError instanceof Error && paymentError.message === "UNAUTHORIZED") {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/register?callbackUrl=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (paymentError instanceof Error && paymentError.message === "EMAIL_REQUIRED") {
        setEmailRequired(true);
        setError("Укажите email для чека.");
        return;
      }
      setError(paymentError instanceof Error ? paymentError.message : "Ошибка оплаты");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {emailRequired && (
        <Input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Email для чека"
        />
      )}
      <Button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
        size={size}
        variant={variant}
      >
        {loading ? "Переход к оплате..." : children}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
