import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { requireSession } from "@/lib/auth";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <AuthGuard session={session}>
      <AppShell session={session}>{children}</AppShell>
    </AuthGuard>
  );
}
