"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import GlobalNav from "@/components/nav/GlobalNav";
import Breadcrumbs from "@/components/nav/Breadcrumbs";
import CommandPalette from "@/components/CommandPalette";
import AssistantSidebar from "@/components/ai/AssistantSidebar";

// Routes that render WITHOUT the app chrome — no header, nav, command palette,
// or "Ask AI" sidebar. The login screen must show none of these.
const BARE_ROUTES = new Set<string>(["/login"]);

export default function AppChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (BARE_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <GlobalNav />
      <Breadcrumbs />
      {children}
      <CommandPalette />
      <AssistantSidebar />
    </>
  );
}
