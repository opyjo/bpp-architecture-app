import { redirect } from "next/navigation";
import HomeHub from "@/components/HomeHub";
import { ALL_TAB_IDS } from "@/lib/tabs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  // Back-compat: old links / installed PWA used `/?tab=<id>`. Redirect those to
  // the new per-tab path so bookmarks and the manifest start_url keep working.
  const { tab } = await searchParams;
  if (typeof tab === "string" && ALL_TAB_IDS.includes(tab)) {
    redirect(`/${tab}`);
  }

  return (
    <div className="flex-1 overflow-hidden">
      <HomeHub />
    </div>
  );
}
