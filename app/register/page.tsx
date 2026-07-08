import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FREE_TOTAL_MARKETING_CARDS, FREE_TRIAL_CARDS } from "@/lib/pricing";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Регистрация",
  description: `Создайте аккаунт MarketCard AI: ${FREE_TRIAL_CARDS} бесплатные генерации после входа, всего ${FREE_TOTAL_MARKETING_CARDS} карточки с демо.`,
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
