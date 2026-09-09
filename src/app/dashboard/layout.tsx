// Server-side layout for the /dashboard area.
// Guards the whole section: unauthenticated visitors are bounced to the
// landing page with the login modal pre-opened via ?login=1.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata = {
  title: "Dashboard | FaizERP",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/?login=1");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    // @ts-expect-error - augmented fields on session.user
    role: session.user.role,
    // @ts-expect-error - augmented fields on session.user
    businessName: session.user.businessName,
  };

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
