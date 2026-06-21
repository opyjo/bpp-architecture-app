import type { Runbook } from "@/data/runbooks";

export interface SavedRunbook {
  id: string;
  title: string;
  severity: string;
  content: Runbook;
  created_at: string;
  updated_at: string;
}
