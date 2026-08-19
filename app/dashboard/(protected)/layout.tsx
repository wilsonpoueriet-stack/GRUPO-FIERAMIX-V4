import { redirect } from "next/navigation";
import AdminLogoutButton from "../AdminLogoutButton";
import AdminDashboardNav from "../AdminDashboardNav";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/dashboard/login");
  }

  return (
    <>
      {children}
      <AdminDashboardNav />
      <AdminLogoutButton />
    </>
  );
}
