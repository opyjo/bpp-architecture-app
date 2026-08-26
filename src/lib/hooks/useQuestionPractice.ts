"use client";

import { useEffect, useState } from "react";
import type { PracticeConfidence } from "@/data/mastercard-prep";

interface QuestionPracticeRow {
  question_key: string;
  confidence: PracticeConfidence;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = "mastercard-question-practice-v1";

/**
 * Tracks a Weak/Developing/Ready self-rating per question key, synced to
 * Supabase via /api/question-practice with a localStorage fallback — same
 * pattern as the STAR-story practice tracker in MentalModelPractice.tsx.
 *
 * Pass `enabled: false` for question banks that don't show confidence controls
 * so they skip the fetch entirely (the hook still obeys the Rules of Hooks
 * since it's always called, just inert when disabled).
 */
export function useQuestionPractice(enabled = true) {
  const [statuses, setStatuses] = useState<Record<string, PracticeConfidence>>({});
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const load = async () => {
      const savedLocal = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLocal) {
        try {
          setStatuses(JSON.parse(savedLocal) as Record<string, PracticeConfidence>);
        } catch {
          window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }

      try {
        const response = await fetch("/api/question-practice", { signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || "Failed to load practice data");

        const rows = body as QuestionPracticeRow[];
        setStatuses((current) => {
          const next = { ...current, ...Object.fromEntries(rows.map((row) => [row.question_key, row.confidence])) };
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
        setSyncNote(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSyncNote("Using this browser's saved confidence ratings; Supabase sync is unavailable until the migration is applied.");
      }
    };

    void load();
    return () => controller.abort();
  }, [enabled]);

  const setConfidence = async (questionKey: string, confidence: PracticeConfidence) => {
    setStatuses((current) => {
      const next = { ...current, [questionKey]: confidence };
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    try {
      const response = await fetch("/api/question-practice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionKey, confidence }),
      });
      if (!response.ok) throw new Error("Failed to sync confidence rating");
      setSyncNote(null);
    } catch {
      setSyncNote("Saved in this browser. Apply the Supabase migration to sync ratings across devices.");
    }
  };

  return { statuses, syncNote, setConfidence };
}
