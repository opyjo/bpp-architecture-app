import type { ChatMessage } from "./chat";

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model_id: string;
  created_at: string;
  updated_at: string;
}
