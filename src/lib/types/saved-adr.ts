export type AdrStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "superseded"
  | "deprecated";

export interface SavedAdr {
  id: string;
  title: string;
  status: AdrStatus;
  context: string;
  decision: string;
  consequences: string;
  alternatives: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
