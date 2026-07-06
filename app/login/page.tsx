import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-paper text-muted">Загрузка…</div>}>
      <LoginForm />
    </Suspense>
  );
}
