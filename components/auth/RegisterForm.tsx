"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { VkIdAuthPanel } from "@/components/auth/VkIdAuthPanel";
import { YandexIdButton } from "@/components/auth/YandexIdButton";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { Logo } from "@/components/Logo";
import { getEmailFormatError } from "@/lib/auth/email-format";
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
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  async function handleResendVerification() {
    if (!registeredEmail) return;

    setResending(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || "Не удалось отправить письмо.");
      }

      setResendMessage(data.message || "Письмо отправлено повторно.");
    } catch (caught) {
      setResendMessage(caught instanceof Error ? caught.message : "Не удалось отправить письмо.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const emailError = getEmailFormatError(email);
    if (emailError) {
      setLoading(false);
      setError(emailError);
      return;
    }

    const registerResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const registerData = (await registerResponse.json()) as { error?: string; email?: string; message?: string };

    setLoading(false);

    if (!registerResponse.ok) {
      setError(registerData.error || "Не удалось зарегистрироваться.");
      return;
    }

    trackConversion("register_complete");
    setRegisteredEmail(registerData.email || email);
    setResendMessage(registerData.message || "Проверьте почту и подтвердите email.");
  }

  if (registeredEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Logo />
            <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-full bg-mint/15 text-mint">
              <MailCheck size={28} />
            </div>
            <h1 className="mt-6 text-3xl font-black text-ink">Подтвердите email</h1>
            <p className="mt-3 text-sm text-muted">
              Мы отправили письмо на <span className="font-bold text-ink">{registeredEmail}</span>. Перейдите по ссылке в
              письме, затем войдите в аккаунт.
            </p>
          </div>

          <div className="rounded-card border border-clay bg-card p-8">
            {resendMessage ? <p className="text-sm font-semibold text-muted">{resendMessage}</p> : null}
            <div className="mt-4 grid gap-3">
              <Button disabled={resending} onClick={() => void handleResendVerification()} type="button" variant="secondary">
                {resending ? <Loader2 className="animate-spin" size={18} /> : null}
                Отправить письмо ещё раз
              </Button>
              <Button onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)} type="button">
                Перейти ко входу
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
          <h1 className="mt-6 text-3xl font-black text-ink">Регистрация</h1>
          <p className="mt-2 text-muted">Сначала подтвердите email — без этого вход и генерации недоступны</p>
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

            {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}

            <p className="text-xs font-medium leading-relaxed text-muted">
              Нажимая «Создать аккаунт», вы принимаете{" "}
              <Link className="text-accent hover:underline" href="/legal/terms">
                пользовательское соглашение
              </Link>
              ,{" "}
              <Link className="text-accent hover:underline" href="/legal/offer">
                публичную оферту
              </Link>{" "}
              и даёте согласие на обработку персональных данных согласно{" "}
              <Link className="text-accent hover:underline" href="/legal/personal-data">
                политике
              </Link>
              .
            </p>

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
            <YandexIdButton onClick={() => signIn("yandex", { callbackUrl })}>
              Продолжить с Яндекс ID
            </YandexIdButton>
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
