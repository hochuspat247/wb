import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Вход",
  description: "Войдите в MarketCard AI, чтобы создавать и сохранять карточки товаров.",
  path: "/login",
  noIndex: true
});

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-muted">Загрузка…</div>}>
      <LoginForm />
    </Suspense>
  );
}
