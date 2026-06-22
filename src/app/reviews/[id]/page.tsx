"use client";

import { use } from "react";
import ReviewDetailView from "@/components/reviews/ReviewDetailView";

export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ReviewDetailView reviewId={id} />;
}
