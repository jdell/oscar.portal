import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  const { from } = await searchParams;

  if (session) {
    redirect(from && from.startsWith("/") ? from : "/agencies");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-sky-700">Oscar Admin</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your organization
          </p>
        </div>
        <LoginForm redirectTo={from} />
      </div>
    </div>
  );
}
