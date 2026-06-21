import type { HighlightedPhrase, CardSection } from "@/data/teleprompter-defaults";

export interface SavedTeleprompterCard {
  id: string;
  title: string;
  category: string;
  bullets: HighlightedPhrase[];
  sections: CardSection[] | null;
  full_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
