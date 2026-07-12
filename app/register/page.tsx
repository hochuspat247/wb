import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { describeFreeQuotaMarketing, describeMonthlyFreeReset } from "@/lib/pricing";
import { createPageMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/branding";

export const metadata = createPageMetadata({
  title: "Регистрация",
  description: `Создайте аккаунт ${BRAND.marketCard}: ${describeFreeQuotaMarketing()}. ${describeMonthlyFreeReset()}.`,
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
