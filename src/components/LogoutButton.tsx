"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error();
      // Clear the cookie client-side already happened; send the user to /login.
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Couldn't sign out. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-7 h-7 flex items-center justify-center rounded border border-arch-border2 bg-arch-bg3 text-arch-text2 hover:bg-arch-border hover:text-arch-red transition-colors disabled:opacity-50"
      aria-label="Sign out"
      title="Sign out"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <LogOut className="size-3.5" />
      )}
    </button>
  );
}
