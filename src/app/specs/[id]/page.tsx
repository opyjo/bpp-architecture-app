"use client";

import { use } from "react";
import SpecDetailView from "@/components/specs/SpecDetailView";

export default function SpecDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SpecDetailView specId={id} />;
}
