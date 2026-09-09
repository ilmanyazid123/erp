// Server-side layout for the /admin area.
// Only the platform administrator (role ADMIN) may enter. Business users
// are bounced back to their dashboard; anonymous visitors get the login.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata = {
  title: "Admin Panel | FaizERP",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/?login=1");
  }

  const role = (session.user as unknown as { role?: string }).role;
  if (role !== "ADMIN") {
    redirect("/dashboard");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    role,
    businessName: null,
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
