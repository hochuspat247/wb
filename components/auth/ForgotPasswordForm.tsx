"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = (await response.json()) as { error?: string; message?: string };

    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Не удалось отправить письмо.");
      return;
    }

    setMessage(data.message || "Если аккаунт существует, мы отправили письмо с инструкцией.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="inline-flex" href="/">
            <Logo />
          </Link>
          <h1 className="mt-6 text-3xl font-black text-ink">Восстановление пароля</h1>
          <p className="mt-2 text-muted">Отправим ссылку для сброса пароля на email</p>
        </div>

        <form className="rounded-[28px] border border-clay bg-card p-6 md:p-8" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Email
            <Input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>

          {error ? <p className="mt-4 text-sm font-semibold text-red-400">{error}</p> : null}
          {message ? <p className="mt-4 text-sm font-semibold text-accent">{message}</p> : null}

          <Button className="mt-6 w-full" disabled={loading} type="submit">
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Отправить ссылку
          </Button>

          <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink" href="/login">
            <ArrowLeft size={16} />
            Назад ко входу
          </Link>
        </form>
      </div>
    </div>
  );
}
