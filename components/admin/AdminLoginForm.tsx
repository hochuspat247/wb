"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function AdminLoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Неверный логин или пароль.");
      }

      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5 py-12">
      <Card className="w-full max-w-md" padding="lg">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent">
            <Shield size={22} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-ink">Вход в админку</h1>
          <p className="mt-2 text-sm text-muted">Статистика, тепловая карта и воронка конверсий</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Логин
            <Input onChange={(event) => setLogin(event.target.value)} required value={login} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink">
            Пароль
            <Input onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error ? <p className="text-sm font-semibold text-accent">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Войти
          </Button>
        </form>

        <Link className="mt-6 block text-center text-sm font-semibold text-muted hover:text-ink" href="/">
          На главную
        </Link>
      </Card>
    </div>
  );
}
