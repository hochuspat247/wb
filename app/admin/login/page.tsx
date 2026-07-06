import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Вход в админку",
  path: "/admin/login",
  noIndex: true
});

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
