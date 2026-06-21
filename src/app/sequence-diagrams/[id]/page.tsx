"use client";

import { use } from "react";
import SequenceDiagramDetailView from "@/components/sequence-diagrams/SequenceDiagramDetailView";

export default function SequenceDiagramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SequenceDiagramDetailView diagramId={id} />;
}
