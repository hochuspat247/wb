"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { VkIdAuthPanel } from "@/components/auth/VkIdAuthPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/cabinet";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный email или пароль.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="inline-flex" href="/">
            <Logo />
          </Link>
          <h1 className="mt-6 text-3xl font-black text-ink">Вход в аккаунт</h1>
          <p className="mt-2 text-muted">Создавайте и храните карточки в личном кабинете</p>
        </div>

        <div className="rounded-card border border-clay bg-card p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Email
              <Input
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Пароль
              <Input
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
              />
            </label>

            {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}

            <Button className="w-full py-3" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              Войти
              <ArrowRight size={16} />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">или</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="grid gap-3">
            <Button
              className="w-full bg-[#FC3F1D] text-white hover:bg-[#e43719]"
              onClick={() => signIn("yandex", { callbackUrl })}
              type="button"
            >
              Войти через Яндекс
            </Button>
            <VkIdAuthPanel callbackUrl={callbackUrl} />
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Нет аккаунта?{" "}
            <Link className="font-bold text-coral hover:text-violet" href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
