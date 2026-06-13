"use client";

import { use } from "react";
import AnalysisDetailView from "@/components/analyses/AnalysisDetailView";

export default function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <AnalysisDetailView analysisId={id} />;
}
