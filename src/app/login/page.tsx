"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Only allow same-origin relative redirects (guards against open redirect).
        const next = searchParams.get("next") || "/";
        const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/";
        router.replace(dest);
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error || "Incorrect password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // Fixed full-screen overlay sits above the app's Header / nav.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-arch-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-arch-border bg-arch-bg2 p-8 shadow-xl">
        <div className="group mb-6 flex flex-col items-center text-center">
          <div className="mb-4 scale-125">
            <Logo />
          </div>
          <h1 className="brand-gradient-text text-xl font-bold tracking-tight">
            conduit-architecture
          </h1>
          <p className="mt-1.5 text-sm text-arch-text2">
            Enter the access password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-arch-text2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="h-10 w-full rounded-lg border border-arch-border bg-arch-bg px-3 text-sm text-arch-text outline-none transition-colors placeholder:text-arch-text3 focus:border-arch-blue focus:ring-2 focus:ring-arch-blue/30"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-arch-red/30 bg-arch-red/10 px-3 py-2 text-xs text-arch-red">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading || password.length === 0}
            className="w-full bg-arch-blue text-white hover:bg-arch-blue/90"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
