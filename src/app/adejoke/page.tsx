import type { Metadata } from "next";
import AdejokeInterviewStudio from "@/components/adejoke/AdejokeInterviewStudio";

export const metadata: Metadata = {
  title: "Adejoke's Interview Studio · City of Hamilton",
  description: "Private preparation workspace for the Senior Project Manager, Enterprise Time & Attendance System interview.",
};

export default function AdejokeInterviewPage() {
  return <AdejokeInterviewStudio />;
}
