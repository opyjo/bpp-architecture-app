import { notFound } from "next/navigation";
import { ALL_TAB_IDS } from "@/lib/tabs";
import TabHost from "@/components/TabHost";

// Each workspace tab is now its own path (e.g. /services, /teleprompter) instead
// of a `?tab=` query on `/`. Distinct pathnames let the App Router cache and
// resolve navigations correctly — same-pathname `?tab=` switching did not.
//
// Static routes (/saved, /analyze, /login, /chats/[id], …) take precedence over
// this dynamic segment, so they are unaffected. Unknown single-segment paths
// 404 via the validation below.

export default async function TabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!ALL_TAB_IDS.includes(tab)) notFound();
  return <TabHost tab={tab} />;
}
