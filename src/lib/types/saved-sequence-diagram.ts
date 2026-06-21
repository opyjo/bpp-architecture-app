export interface SavedSequenceDiagram {
  id: string;
  title: string;
  description: string;
  mermaid_source: string;
  flow_id?: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}
