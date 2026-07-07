"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password })
    });
    const data = (await response.json()) as { error?: string };

    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Не удалось обновить пароль.");
      return;
    }

    router.push("/login?reset=1");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
          <h1 className="mt-6 text-3xl font-black text-ink">Новый пароль</h1>
        </div>

        <form className="rounded-[28px] border border-clay bg-card p-6 md:p-8" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Новый пароль
            <Input minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-semibold text-ink">
            Повторите пароль
            <Input minLength={8} onChange={(event) => setConfirm(event.target.value)} required type="password" value={confirm} />
          </label>

          {error ? <p className="mt-4 text-sm font-semibold text-red-400">{error}</p> : null}

          <Button className="mt-6 w-full" disabled={loading || !email || !token} type="submit">
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Сохранить пароль
          </Button>
        </form>
      </div>
    </div>
  );
}
