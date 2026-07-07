import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Регистрация",
  description: "Создайте аккаунт MarketCard AI и получите 3 бесплатные генерации карточек товара.",
  path: "/register",
  noIndex: true
});

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-muted">Загрузка…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
