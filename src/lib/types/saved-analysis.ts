import type { ChatMessage } from "./chat";

export interface SavedAnalysis {
  id: string;
  title: string;
  ticket_text: string;
  messages: ChatMessage[];
  model_id: string;
  created_at: string;
  updated_at: string;
}
