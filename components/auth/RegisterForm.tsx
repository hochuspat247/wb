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

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/cabinet";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const registerResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const registerData = (await registerResponse.json()) as { error?: string };

    if (!registerResponse.ok) {
      setLoading(false);
      setError(registerData.error || "Не удалось зарегистрироваться.");
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Аккаунт создан, но вход не удался. Попробуйте войти вручную.");
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
          <h1 className="mt-6 text-3xl font-black text-ink">Регистрация</h1>
          <p className="mt-2 text-muted">1 карточка бесплатно · без привязки карты</p>
        </div>

        <div className="rounded-card border border-clay bg-card p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-bold text-ink">
              Имя
              <Input
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Как к вам обращаться"
                value={name}
              />
            </label>
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
                autoComplete="new-password"
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                type="password"
                value={password}
              />
            </label>

            {error ? <p className="text-sm font-semibold text-accent">{error}</p> : null}

            <Button className="w-full py-3" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : null}
              Создать аккаунт
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
              Регистрация через Яндекс
            </Button>
            <VkIdAuthPanel callbackUrl={callbackUrl} />
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Уже есть аккаунт?{" "}
            <Link className="font-bold text-accent hover:text-ink" href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
