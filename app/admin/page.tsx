import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/server/admin";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Админка",
  path: "/admin",
  noIndex: true
});

export default async function AdminPage() {
  const allowed = await isAdminAuthenticated();

  if (!allowed) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
