import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-muted">Загрузка…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
