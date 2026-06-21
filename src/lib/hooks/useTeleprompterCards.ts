"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  TeleprompterCard,
  DEFAULT_TELEPROMPTER_CARDS,
} from "@/data/teleprompter-defaults";

const STORAGE_KEY = "teleprompter-cards";

export function useTeleprompterCards() {
  const [cards, setCards] = useState<TeleprompterCard[]>(
    DEFAULT_TELEPROMPTER_CARDS
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const initialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TeleprompterCard[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(parsed);
        }
      }
    } catch {
      // Fall back to defaults
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // Storage full or unavailable
    }
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
      setCards((prev) => [...prev, newCard]);
      setCurrentIndex(cards.length); // Navigate to new card
    },
    [cards.length]
  );

  const updateCard = useCallback(
    (id: string, updates: Partial<Omit<TeleprompterCard, "id">>) => {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const deleteCard = useCallback(
    (id: string) => {
      setCards((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        return filtered.length > 0 ? filtered : DEFAULT_TELEPROMPTER_CARDS;
      });
      setCurrentIndex((i) => Math.min(i, cards.length - 2));
    },
    [cards.length]
  );

  const resetToDefaults = useCallback(() => {
    setCards(DEFAULT_TELEPROMPTER_CARDS);
    setCurrentIndex(0);
    setIsEditing(false);
  }, []);

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
