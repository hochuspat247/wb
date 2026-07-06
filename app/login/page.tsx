import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mesh-page grid min-h-screen place-items-center text-muted">Загрузка…</div>}>
      <LoginForm />
    </Suspense>
  );
}
