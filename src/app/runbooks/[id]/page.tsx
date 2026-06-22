"use client";

import { use } from "react";
import RunbookDetailView from "@/components/runbooks/RunbookDetailView";

export default function RunbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <RunbookDetailView runbookId={id} />;
}
