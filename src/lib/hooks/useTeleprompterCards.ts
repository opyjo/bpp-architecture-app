"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  TeleprompterCard,
  DEFAULT_TELEPROMPTER_CARDS,
  DEFAULT_ROLE,
  makeStarterCardsForRole,
} from "@/data/teleprompter-defaults";
import { useSavedTeleprompterCards } from "./useSavedTeleprompterCards";
import type { SavedTeleprompterCard } from "@/lib/types/saved-teleprompter-card";
import type { CardCategory } from "@/data/teleprompter-defaults";

const STORAGE_KEY = "teleprompter-cards";
const ROLE_KEY = "teleprompter-active-role";
// The base role's name is hardcoded as DEFAULT_ROLE, but the user can rename it;
// the override lives here so the new name survives reloads.
const DEFAULT_ROLE_KEY = "teleprompter-default-role";

// ── Converters ──────────────────────────────────────────────────────

function toDbRow(card: TeleprompterCard, sortOrder: number) {
  return {
    id: card.id,
    title: card.title,
    category: card.category,
    bullets: card.bullets,
    sections: card.sections ?? null,
    full_text: card.fullText ?? null,
    role: card.role ?? null,
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
    ...(row.role ? { role: row.role } : {}),
  };
}

function isVisibleForRole(card: TeleprompterCard, role: string): boolean {
  return !card.role || card.role === role;
}

// ── Hook ────────────────────────────────────────────────────────────

export function useTeleprompterCards() {
  // Full, persisted list (all roles). The navigable `cards` below is the
  // role-filtered view derived from this.
  const [allCards, setAllCards] = useState<TeleprompterCard[]>([]);
  // The base role's display name — DEFAULT_ROLE unless the user renamed it.
  const [defaultRole, setDefaultRole] = useState<string>(() => {
    try {
      return localStorage.getItem(DEFAULT_ROLE_KEY) || DEFAULT_ROLE;
    } catch {
      return DEFAULT_ROLE;
    }
  });
  const [activeRole, setActiveRoleState] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(ROLE_KEY) ||
        localStorage.getItem(DEFAULT_ROLE_KEY) ||
        DEFAULT_ROLE
      );
    } catch {
      return DEFAULT_ROLE;
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);
  // When a card is created/cloned (possibly into another role), we stash its id
  // here so the focus effect below can select it once it lands in the visible
  // deck — after any role switch has re-derived `cards`.
  const pendingFocusId = useRef<string | null>(null);

  const {
    fetchTeleprompterCards,
    saveTeleprompterCard,
    updateTeleprompterCard,
    deleteTeleprompterCard,
    deleteAllTeleprompterCards,
    batchUpdateSortOrders,
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
          setAllCards(loaded);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded)); } catch { /* */ }
          setIsLoading(false);
          return;
        }
      } catch {
        // DB unavailable — fall through to localStorage
      }

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TeleprompterCard[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllCards(parsed);
            setIsLoading(false);
            return;
          }
        }
      } catch { /* */ }

      setAllCards(DEFAULT_TELEPROMPTER_CARDS);
      setIsLoading(false);
    })();
  }, [fetchTeleprompterCards]);

  // Persist full list to localStorage on change (fast cache)
  useEffect(() => {
    if (!initialized.current || allCards.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allCards));
    } catch { /* */ }
  }, [allCards]);

  // The navigable deck for the active role = shared cards + this role's cards.
  const cards = useMemo(
    () => allCards.filter((c) => isVisibleForRole(c, activeRole)),
    [allCards, activeRole]
  );

  // Available roles = default role + any role present on a card.
  const roles = useMemo(() => {
    const set = new Set<string>([defaultRole]);
    for (const c of allCards) if (c.role) set.add(c.role);
    return Array.from(set);
  }, [allCards, defaultRole]);

  // Card count per role (shared cards counted in every role) — for the picker.
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const role of roles) {
      counts[role] = allCards.filter((c) => isVisibleForRole(c, role)).length;
    }
    return counts;
  }, [roles, allCards]);

  // How many cards are shared across all roles.
  const sharedCount = useMemo(
    () => allCards.filter((c) => !c.role).length,
    [allCards]
  );

  // Reset position when switching roles.
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeRole]);

  // Keep currentIndex within the (possibly shrunken) deck.
  useEffect(() => {
    setCurrentIndex((i) => (i > cards.length - 1 ? Math.max(0, cards.length - 1) : i));
  }, [cards.length]);

  // Focus a freshly created/cloned card once it appears in the active deck.
  // Declared last so it wins over the role-switch reset above on the same tick.
  useEffect(() => {
    const id = pendingFocusId.current;
    if (!id) return;
    const idx = cards.findIndex((c) => c.id === id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      pendingFocusId.current = null;
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

  const setActiveRole = useCallback((name: string) => {
    setActiveRoleState(name);
    try { localStorage.setItem(ROLE_KEY, name); } catch { /* */ }
    setCurrentIndex(0);
  }, []);

  const addCard = useCallback(
    (card: Omit<TeleprompterCard, "id">) => {
      const newCard: TeleprompterCard = { ...card, id: crypto.randomUUID() };
      const sortOrder = allCards.length;
      setAllCards((prev) => [...prev, newCard]);

      // Focus the new card if it's visible in the current role deck.
      if (isVisibleForRole(newCard, activeRole)) {
        const visibleLen = allCards.filter((c) => isVisibleForRole(c, activeRole)).length;
        setCurrentIndex(visibleLen);
      }

      const { id: _, ...payload } = toDbRow(newCard, sortOrder);
      saveTeleprompterCard(payload)
        .then(() => toast.success("Card added"))
        .catch(() => toast.error("Failed to save card"));
    },
    [allCards, activeRole, saveTeleprompterCard]
  );

  // targetRole controls what role the copy gets:
  //   undefined → keep the source card's role (plain duplicate)
  //   ""        → Shared (visible under every role)
  //   "<role>"  → that specific role
  // When the copy lands in a different role, we switch to it so the user can
  // edit the duplicate right away.
  const cloneCard = useCallback(
    (id: string, targetRole?: string) => {
      const source = allCards.find((c) => c.id === id);
      if (!source) return;

      const roleForClone =
        targetRole === undefined ? source.role : targetRole || undefined;

      const cloned: TeleprompterCard = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
        title: `${source.title} (Copy)`,
      };
      if (roleForClone) cloned.role = roleForClone;
      else delete cloned.role;
      if (cloned.sections) {
        cloned.sections = cloned.sections.map((s) => ({ ...s, id: crypto.randomUUID() }));
      }

      const sortOrder = allCards.length;
      setAllCards((prev) => [...prev, cloned]);

      // Focus the copy once it shows up — switching roles first if needed.
      pendingFocusId.current = cloned.id;
      if (roleForClone && roleForClone !== activeRole) {
        setActiveRole(roleForClone);
      }

      const movedRoles = targetRole !== undefined && roleForClone !== source.role;
      const { id: _id, ...payload } = toDbRow(cloned, sortOrder);
      saveTeleprompterCard(payload)
        .then(() =>
          toast.success(
            movedRoles
              ? `Duplicated into "${roleForClone ?? "Shared"}"`
              : "Card duplicated"
          )
        )
        .catch(() => toast.error("Failed to duplicate card"));
    },
    [allCards, activeRole, saveTeleprompterCard, setActiveRole]
  );

  const updateCard = useCallback(
    (id: string, updates: Partial<Omit<TeleprompterCard, "id">>) => {
      setAllCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.bullets !== undefined) dbUpdates.bullets = updates.bullets;
      if (updates.sections !== undefined) dbUpdates.sections = updates.sections ?? null;
      if (updates.fullText !== undefined) dbUpdates.full_text = updates.fullText ?? null;
      // Persist role whenever the key is present, so "→ Shared" (undefined) saves too.
      if ("role" in updates) dbUpdates.role = updates.role ?? null;

      if (Object.keys(dbUpdates).length > 0) {
        updateTeleprompterCard(id, dbUpdates).catch(() => toast.error("Failed to update card"));
      }
    },
    [updateTeleprompterCard]
  );

  const deleteCard = useCallback(
    (id: string) => {
      setAllCards((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        return filtered.length > 0 ? filtered : DEFAULT_TELEPROMPTER_CARDS;
      });

      deleteTeleprompterCard(id)
        .then(() => toast.success("Card deleted"))
        .catch(() => toast.error("Failed to delete card"));
    },
    [deleteTeleprompterCard]
  );

  // fromIndex / toIndex are positions within the active role's visible deck.
  const moveCard = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      setAllCards((prev) => {
        const visible = prev.filter((c) => isVisibleForRole(c, activeRole));
        const newVisible = [...visible];
        const [moved] = newVisible.splice(fromIndex, 1);
        if (!moved) return prev;
        newVisible.splice(toIndex, 0, moved);

        // Re-thread the reordered visible cards back into their slots.
        let vi = 0;
        const next = prev.map((c) => (isVisibleForRole(c, activeRole) ? newVisible[vi++] : c));

        const updates = next.map((card, i) => ({ id: card.id, sort_order: i }));
        batchUpdateSortOrders(updates).catch(() => toast.error("Failed to reorder cards"));
        return next;
      });
      setCurrentIndex(toIndex);
    },
    [activeRole, batchUpdateSortOrders]
  );

  const resetToDefaults = useCallback(() => {
    setAllCards(DEFAULT_TELEPROMPTER_CARDS);
    setCurrentIndex(0);
    setIsEditing(false);

    // Defaults are tagged with the hardcoded base role — drop any rename override.
    setDefaultRole(DEFAULT_ROLE);
    setActiveRoleState(DEFAULT_ROLE);
    try {
      localStorage.removeItem(DEFAULT_ROLE_KEY);
      localStorage.setItem(ROLE_KEY, DEFAULT_ROLE);
    } catch { /* */ }

    (async () => {
      try {
        await deleteAllTeleprompterCards();
        await Promise.all(
          DEFAULT_TELEPROMPTER_CARDS.map((card, i) => {
            const { id: _, ...payload } = toDbRow(card, i);
            return saveTeleprompterCard(payload);
          })
        );
        toast.success("Cards reset to defaults");
      } catch {
        toast.error("Failed to reset cards");
      }
    })();
  }, [deleteAllTeleprompterCards, saveTeleprompterCard]);

  // ── Roles ─────────────────────────────────────────────────────────

  const addRole = useCallback(
    (name: string) => {
      const role = name.trim();
      if (!role) return;
      if (roles.includes(role)) {
        setActiveRole(role);
        return;
      }

      const starters = makeStarterCardsForRole(role).map((c) => ({
        ...c,
        id: crypto.randomUUID(),
      }));
      const base = allCards.length;
      setAllCards((prev) => [...prev, ...starters]);
      starters.forEach((card, idx) => {
        const { id: _id, ...payload } = toDbRow(card, base + idx);
        saveTeleprompterCard(payload).catch(() => { /* surfaced once below */ });
      });

      setActiveRoleState(role);
      try { localStorage.setItem(ROLE_KEY, role); } catch { /* */ }
      setCurrentIndex(0);
      toast.success(`Added role "${role}" with starter cards`);
    },
    [roles, allCards.length, saveTeleprompterCard, setActiveRole]
  );

  const renameRole = useCallback(
    (oldName: string, rawNext: string) => {
      const next = rawNext.trim();
      if (!next || next === oldName) return;
      if (roles.some((r) => r !== oldName && r.toLowerCase() === next.toLowerCase())) {
        toast.error(`Role "${next}" already exists`);
        return;
      }

      const affected = allCards.filter((c) => c.role === oldName);
      if (affected.length > 0) {
        setAllCards((prev) =>
          prev.map((c) => (c.role === oldName ? { ...c, role: next } : c))
        );
        Promise.all(affected.map((c) => updateTeleprompterCard(c.id, { role: next })))
          .then(() => toast.success(`Renamed "${oldName}" to "${next}"`))
          .catch(() => toast.error("Failed to rename role"));
      } else {
        // The base role can have zero tagged cards (its deck is just shared cards).
        toast.success(`Renamed "${oldName}" to "${next}"`);
      }

      // Renaming the base role persists a new display name.
      if (oldName === defaultRole) {
        setDefaultRole(next);
        try { localStorage.setItem(DEFAULT_ROLE_KEY, next); } catch { /* */ }
      }
      if (activeRole === oldName) setActiveRole(next);
    },
    [roles, allCards, activeRole, defaultRole, updateTeleprompterCard, setActiveRole]
  );

  const deleteRole = useCallback(
    (name: string) => {
      if (name === defaultRole) {
        toast.error("The default role can't be deleted");
        return;
      }
      const removed = allCards.filter((c) => c.role === name);
      setAllCards((prev) => {
        const next = prev.filter((c) => c.role !== name);
        return next.length > 0 ? next : DEFAULT_TELEPROMPTER_CARDS;
      });
      removed.forEach((c) => deleteTeleprompterCard(c.id).catch(() => { /* */ }));

      setActiveRoleState(defaultRole);
      try { localStorage.setItem(ROLE_KEY, defaultRole); } catch { /* */ }
      setCurrentIndex(0);
      toast.success(`Deleted role "${name}"`);
    },
    [allCards, defaultRole, deleteTeleprompterCard]
  );

  return {
    cards,
    currentIndex,
    currentCard,
    isLoading,
    isEditing,
    setIsEditing,
    goNext,
    goPrev,
    goTo,
    addCard,
    cloneCard,
    updateCard,
    deleteCard,
    moveCard,
    resetToDefaults,
    // roles
    activeRole,
    roles,
    roleCounts,
    sharedCount,
    defaultRole,
    setActiveRole,
    addRole,
    renameRole,
    deleteRole,
  };
}
