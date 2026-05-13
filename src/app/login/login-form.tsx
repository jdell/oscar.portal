"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password";
    case "auth/too-many-requests":
      return "Too many failed attempts — try again later";
    case "auth/user-disabled":
      return "This account has been disabled";
    default:
      return "Sign-in failed — try again";
  }
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      // Step 1 — Firebase authentication
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password,
      );
      const firebaseToken = await credential.user.getIdToken();

      // Step 2 — Exchange Firebase token for an oscar API JWT
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const apiResponse = await fetch(`${apiBase}/accounts/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token: firebaseToken }),
      });

      if (!apiResponse.ok) {
        toast.error("Invalid credentials");
        return;
      }

      const { access } = (await apiResponse.json()) as { access: string };

      // Step 3 — Store JWT in an httpOnly session cookie via Next.js
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access }),
      });

      if (!sessionResponse.ok) {
        toast.error("Login failed");
        return;
      }

      const target =
        redirectTo && redirectTo.startsWith("/") ? redirectTo : "/agencies";
      router.push(target);
      router.refresh();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.startsWith("auth/")) {
        toast.error(firebaseErrorMessage(code));
      } else {
        toast.error("Network error — try again");
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          className="h-11 rounded-xl border-slate-200 bg-white focus-visible:border-sky-400 focus-visible:ring-4 focus-visible:ring-sky-500/15 transition-shadow duration-200"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-slate-700"
        >
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="h-11 rounded-xl border-slate-200 bg-white pr-10 focus-visible:border-sky-400 focus-visible:ring-4 focus-visible:ring-sky-500/15 transition-shadow duration-200"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200"
      >
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
