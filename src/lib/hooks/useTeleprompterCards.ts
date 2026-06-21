"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  TeleprompterCard,
  DEFAULT_TELEPROMPTER_CARDS,
} from "@/data/teleprompter-defaults";
import { useSavedTeleprompterCards } from "./useSavedTeleprompterCards";
import type { SavedTeleprompterCard } from "@/lib/types/saved-teleprompter-card";
import type { CardCategory } from "@/data/teleprompter-defaults";

const STORAGE_KEY = "teleprompter-cards";

// ── Converters ──────────────────────────────────────────────────────

function toDbRow(card: TeleprompterCard, sortOrder: number) {
  return {
    id: card.id,
    title: card.title,
    category: card.category,
    bullets: card.bullets,
    sections: card.sections ?? null,
    full_text: card.fullText ?? null,
    sort_order: sortOrder,
  };
}

function fromDbRow(row: SavedTeleprompterCard): TeleprompterCard {
  return {
    id: row.id,
    title: row.title,
    category: row.category as CardCategory,
    bullets: row.bullets,
    ...(row.sections ? { sections: row.sections } : {}),
    ...(row.full_text ? { fullText: row.full_text } : {}),
  };
}

// ── Hook ────────────────────────────────────────────────────────────

export function useTeleprompterCards() {
  const [cards, setCards] = useState<TeleprompterCard[]>(DEFAULT_TELEPROMPTER_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const initialized = useRef(false);

  const {
    fetchTeleprompterCards,
    saveTeleprompterCard,
    updateTeleprompterCard,
    deleteTeleprompterCard,
    deleteAllTeleprompterCards,
  } = useSavedTeleprompterCards();

  // Load from Supabase on mount, fall back to localStorage → defaults
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const rows = await fetchTeleprompterCards();
        if (rows.length > 0) {
          const loaded = rows.map(fromDbRow);
          setCards(loaded);
          // Update localStorage cache
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded)); } catch { /* */ }
          return;
        }
      } catch {
        // DB unavailable — fall through to localStorage
      }

      // Fall back to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TeleprompterCard[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed);
            return;
          }
        }
      } catch { /* */ }

      // Final fallback: defaults (already set as initial state)
    })();
  }, [fetchTeleprompterCards]);

  // Persist to localStorage on change (fast cache)
  useEffect(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch { /* */ }
  }, [cards]);

  const currentCard = cards[currentIndex] ?? cards[0];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % cards.length);
  }, [cards.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
  }, [cards.length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, cards.length - 1)));
    },
    [cards.length]
  );

  const addCard = useCallback(
    (card: Omit<TeleprompterCard, "id">) => {
      const newCard: TeleprompterCard = {
        ...card,
        id: crypto.randomUUID(),
      };
      const sortOrder = cards.length;
      setCards((prev) => [...prev, newCard]);
      setCurrentIndex(cards.length);

      // Fire-and-forget DB insert
      const { id: _, ...payload } = toDbRow(newCard, sortOrder);
      saveTeleprompterCard(payload).catch(() => {});
    },
    [cards.length, saveTeleprompterCard]
  );

  const updateCard = useCallback(
    (id: string, updates: Partial<Omit<TeleprompterCard, "id">>) => {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      // Fire-and-forget DB update
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.bullets !== undefined) dbUpdates.bullets = updates.bullets;
      if (updates.sections !== undefined) dbUpdates.sections = updates.sections ?? null;
      if (updates.fullText !== undefined) dbUpdates.full_text = updates.fullText ?? null;

      if (Object.keys(dbUpdates).length > 0) {
        updateTeleprompterCard(id, dbUpdates).catch(() => {});
      }
    },
    [updateTeleprompterCard]
  );

  const deleteCard = useCallback(
    (id: string) => {
      setCards((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        return filtered.length > 0 ? filtered : DEFAULT_TELEPROMPTER_CARDS;
      });
      setCurrentIndex((i) => Math.min(i, cards.length - 2));

      // Fire-and-forget DB delete
      deleteTeleprompterCard(id).catch(() => {});
    },
    [cards.length, deleteTeleprompterCard]
  );

  const resetToDefaults = useCallback(() => {
    setCards(DEFAULT_TELEPROMPTER_CARDS);
    setCurrentIndex(0);
    setIsEditing(false);

    // Fire-and-forget: delete all rows, then insert defaults
    (async () => {
      try {
        await deleteAllTeleprompterCards();
        await Promise.all(
          DEFAULT_TELEPROMPTER_CARDS.map((card, i) => {
            const { id: _, ...payload } = toDbRow(card, i);
            return saveTeleprompterCard(payload);
          })
        );
      } catch { /* */ }
    })();
  }, [deleteAllTeleprompterCards, saveTeleprompterCard]);

  return {
    cards,
    currentIndex,
    currentCard,
    isEditing,
    setIsEditing,
    goNext,
    goPrev,
    goTo,
    addCard,
    updateCard,
    deleteCard,
    resetToDefaults,
  };
}
