"use client";

import { use } from "react";
import TestPlanDetailView from "@/components/test-plans/TestPlanDetailView";

export default function TestPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TestPlanDetailView planId={id} />;
}
