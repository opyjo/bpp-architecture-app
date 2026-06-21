"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Monitor,
  Trash2,
  Check,
  X,
  ChevronDown,
  LayoutGrid,
  Presentation,
} from "lucide-react";
import { useTeleprompterCards } from "@/lib/hooks/useTeleprompterCards";
import {
  type TeleprompterCard,
  type HighlightedPhrase,
  type CardCategory,
  type CardSection,
  type HighlightColor,
  CATEGORY_COLORS,
  getAllBullets,
} from "@/data/teleprompter-defaults";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Static color class maps (no dynamic construction) ──────────────────────

const COLOR_TEXT_CLASSES: Record<HighlightColor, string> = {
  blue: "text-arch-blue",
  purple: "text-arch-purple",
  teal: "text-arch-teal",
  amber: "text-amber-500",
  green: "text-arch-green",
  coral: "text-arch-coral",
};

const COLOR_BG_CLASSES: Record<HighlightColor, string> = {
  blue: "bg-arch-blue/15",
  purple: "bg-arch-purple/15",
  teal: "bg-arch-teal/15",
  amber: "bg-amber-500/15",
  green: "bg-arch-green/15",
  coral: "bg-arch-coral/15",
};

const COLOR_RING_CLASSES: Record<HighlightColor, string> = {
  blue: "ring-arch-blue",
  purple: "ring-arch-purple",
  teal: "ring-arch-teal",
  amber: "ring-amber-500",
  green: "ring-arch-green",
  coral: "ring-arch-coral",
};

const ALL_CATEGORIES: CardCategory[] = [
  "Opening",
  "STAR",
  "Technical",
  "Behavioral",
  "Closing",
  "Scenario",
];

const ALL_COLORS: HighlightColor[] = [
  "blue",
  "purple",
  "teal",
  "amber",
  "green",
  "coral",
];

// ── Inline sub-components ──────────────────────────────────────────────────

function HighlightedBullet({ phrase }: { phrase: HighlightedPhrase }) {
  const parts = phrase.text.split(/(\*\*.*?\*\*)/g);
  return (
    <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-arch-text2">
      <span
        className={`mt-2 w-2 h-2 rounded-full shrink-0 ${COLOR_BG_CLASSES[phrase.color]} ring-2 ${COLOR_RING_CLASSES[phrase.color]}`}
      />
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const keyword = part.slice(2, -2);
            return (
              <span
                key={i}
                className={`font-bold ${COLOR_TEXT_CLASSES[phrase.color]} ${COLOR_BG_CLASSES[phrase.color]} px-1 py-0.5 rounded animate-keyword-glow`}
              >
                {keyword}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    </li>
  );
}

function SectionedBullets({ sections }: { sections: CardSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-[14px] font-semibold text-arch-text3 uppercase tracking-wider mb-3">
            {section.name}
          </h3>
          <ul className="flex flex-col gap-4 pl-1">
            {section.bullets.map((bullet, i) => (
              <HighlightedBullet key={i} phrase={bullet} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CategoryBadge({ category, size = "lg" }: { category: CardCategory; size?: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${CATEGORY_COLORS[category]} ${
        size === "sm"
          ? "px-2.5 py-0.5 text-[11px]"
          : "px-3.5 py-1 text-[14px]"
      }`}
    >
      {category}
    </span>
  );
}

function CardView({
  card,
  onEdit,
}: {
  card: TeleprompterCard;
  onEdit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-arch-text leading-tight text-[20px]">
            {card.title}
          </h2>
          <CategoryBadge category={card.category} />
        </div>
        <button
          onClick={onEdit}
          className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors shrink-0"
          title="Edit card"
        >
          <Pencil size={16} />
        </button>
      </div>

      {card.sections && card.sections.length > 0 ? (
        <SectionedBullets sections={card.sections} />
      ) : (
        <ul className="flex flex-col gap-4 pl-1">
          {card.bullets.map((bullet, i) => (
            <HighlightedBullet key={i} phrase={bullet} />
          ))}
        </ul>
      )}

      {card.fullText && (
        <div className="border-t border-arch-border pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-[13px] font-medium text-arch-text3 hover:text-arch-text transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            {expanded ? "Hide" : "Show"} full text
          </button>
          {expanded && (
            <p className="mt-3 text-[14px] leading-relaxed text-arch-text3 whitespace-pre-wrap">
              {card.fullText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function toggleWordKeyword(text: string, wordIndex: number): string {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  let runningIndex = 0;
  const newParts: string[] = [];

  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      newParts.push(part);
    } else {
      const words = part.split(/(\s+)/);
      const rebuilt: string[] = [];
      for (const word of words) {
        if (/^\s+$/.test(word) || word === "") {
          rebuilt.push(word);
        } else {
          if (runningIndex === wordIndex) {
            rebuilt.push(`**${word}**`);
          } else {
            rebuilt.push(word);
          }
          runningIndex++;
        }
      }
      newParts.push(rebuilt.join(""));
    }
  }

  return newParts.join("");
}

function untagKeyword(text: string, keywordText: string, keywordOccurrence: number): string {
  let occurrence = 0;
  return text.replace(/\*\*(.*?)\*\*/g, (match, inner) => {
    if (inner === keywordText) {
      if (occurrence === keywordOccurrence) {
        occurrence++;
        return inner;
      }
      occurrence++;
    }
    return match;
  });
}

function WordTokens({
  text,
  color,
  onToggle,
}: {
  text: string;
  color: HighlightColor;
  onToggle: (newText: string) => void;
}) {
  if (!text.trim()) return null;

  const parts = text.split(/(\*\*.*?\*\*)/g);
  const tokens: { label: string; isKeyword: boolean; wordIndex: number; keywordOccurrence: number }[] = [];
  let wordIndex = 0;
  const keywordCounts: Record<string, number> = {};

  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      const keyword = part.slice(2, -2);
      const occ = keywordCounts[keyword] ?? 0;
      keywordCounts[keyword] = occ + 1;
      tokens.push({ label: keyword, isKeyword: true, wordIndex: -1, keywordOccurrence: occ });
    } else {
      const words = part.split(/\s+/).filter(Boolean);
      for (const word of words) {
        tokens.push({ label: word, isKeyword: false, wordIndex, keywordOccurrence: 0 });
        wordIndex++;
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tokens.map((token, i) =>
        token.isKeyword ? (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(untagKeyword(text, token.label, token.keywordOccurrence))}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${COLOR_BG_CLASSES[color]} ${COLOR_TEXT_CLASSES[color]}`}
          >
            {token.label}
          </button>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onToggle(toggleWordKeyword(text, token.wordIndex))}
            className="px-2 py-0.5 rounded text-[11px] text-arch-text3 hover:bg-arch-bg3 cursor-pointer"
          >
            {token.label}
          </button>
        )
      )}
    </div>
  );
}

function BulletEditor({
  bullet,
  onChange,
  onRemove,
}: {
  bullet: HighlightedPhrase;
  onChange: (b: HighlightedPhrase) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={bullet.text}
          onChange={(e) => onChange({ ...bullet, text: e.target.value })}
          className="flex-1 bg-arch-bg1 border border-arch-border rounded-lg px-3 py-1.5 text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
          placeholder="Type your bullet text here"
        />
        <select
          value={bullet.color}
          onChange={(e) =>
            onChange({ ...bullet, color: e.target.value as HighlightColor })
          }
          className="bg-arch-bg1 border border-arch-border rounded-lg px-2 py-1.5 text-[11px] text-arch-text focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
        >
          {ALL_COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={onRemove}
          className="p-1.5 text-arch-text3 hover:text-arch-coral transition-colors"
          title="Remove bullet"
        >
          <X size={14} />
        </button>
      </div>
      <WordTokens
        text={bullet.text}
        color={bullet.color}
        onToggle={(newText) => onChange({ ...bullet, text: newText })}
      />
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onRemove,
}: {
  section: CardSection;
  onChange: (s: CardSection) => void;
  onRemove: () => void;
}) {
  const updateBullet = (index: number, updated: HighlightedPhrase) => {
    const newBullets = section.bullets.map((b, i) => (i === index ? updated : b));
    onChange({ ...section, bullets: newBullets });
  };

  const removeBullet = (index: number) => {
    onChange({ ...section, bullets: section.bullets.filter((_, i) => i !== index) });
  };

  const addBullet = () => {
    onChange({ ...section, bullets: [...section.bullets, { text: "", color: "blue" }] });
  };

  return (
    <div className="bg-arch-bg1 rounded-lg border border-arch-border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={section.name}
          onChange={(e) => onChange({ ...section, name: e.target.value })}
          className="flex-1 bg-transparent border-b border-arch-border px-1 py-0.5 text-[12px] font-semibold text-arch-text placeholder:text-arch-text3 focus:outline-none focus:border-arch-blue/50"
          placeholder="Section name"
        />
        <button
          onClick={onRemove}
          className="p-1.5 text-arch-text3 hover:text-arch-coral transition-colors"
          title="Remove section"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {section.bullets.map((bullet, i) => (
          <BulletEditor
            key={i}
            bullet={bullet}
            onChange={(b) => updateBullet(i, b)}
            onRemove={() => removeBullet(i)}
          />
        ))}
        <button
          onClick={addBullet}
          className="flex items-center gap-1.5 text-[11px] font-medium text-arch-text3 hover:text-arch-blue transition-colors w-fit"
        >
          <Plus size={12} /> Add bullet
        </button>
      </div>
    </div>
  );
}

function CardEditor({
  card,
  onSave,
  onCancel,
  onDelete,
}: {
  card: TeleprompterCard;
  onSave: (updates: Partial<Omit<TeleprompterCard, "id">>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [category, setCategory] = useState<CardCategory>(card.category);
  const [bullets, setBullets] = useState<HighlightedPhrase[]>([
    ...card.bullets,
  ]);
  const [sections, setSections] = useState<CardSection[] | null>(
    card.sections?.length ? card.sections.map((s) => ({ ...s, bullets: [...s.bullets] })) : null
  );
  const [fullText, setFullText] = useState(card.fullText ?? "");

  const updateBullet = (index: number, updated: HighlightedPhrase) => {
    setBullets((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const removeBullet = (index: number) => {
    setBullets((prev) => prev.filter((_, i) => i !== index));
  };

  const addBullet = () => {
    setBullets((prev) => [...prev, { text: "", color: "blue" }]);
  };

  const addSections = () => {
    const firstSection: CardSection = {
      id: crypto.randomUUID(),
      name: "Section 1",
      bullets: bullets.length > 0 ? [...bullets] : [{ text: "", color: "blue" }],
    };
    setSections([firstSection]);
  };

  const removeSections = () => {
    if (sections) {
      const allBullets = sections.flatMap((s) => s.bullets);
      setBullets(allBullets.length > 0 ? allBullets : [{ text: "", color: "blue" }]);
    }
    setSections(null);
  };

  const updateSection = (index: number, updated: CardSection) => {
    setSections((prev) => prev && prev.map((s, i) => (i === index ? updated : s)));
  };

  const removeSection = (index: number) => {
    setSections((prev) => {
      if (!prev) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  };

  const addSection = () => {
    setSections((prev) => [
      ...(prev ?? []),
      { id: crypto.randomUUID(), name: "", bullets: [{ text: "", color: "blue" }] },
    ]);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (sections) {
      const filteredSections = sections
        .map((s) => ({ ...s, bullets: s.bullets.filter((b) => b.text.trim()) }))
        .filter((s) => s.bullets.length > 0);
      if (filteredSections.length === 0) return;
      onSave({
        title: title.trim(),
        category,
        bullets: [],
        sections: filteredSections,
        fullText: fullText.trim() || undefined,
      });
    } else {
      const trimmedBullets = bullets.filter((b) => b.text.trim());
      if (trimmedBullets.length === 0) return;
      onSave({
        title: title.trim(),
        category,
        bullets: trimmedBullets,
        sections: undefined,
        fullText: fullText.trim() || undefined,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-arch-bg1 border border-arch-border rounded-lg px-3 py-2 text-[14px] font-semibold text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
          placeholder="Card title"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CardCategory)}
          className="bg-arch-bg1 border border-arch-border rounded-lg px-3 py-1.5 text-[12px] text-arch-text focus:outline-none focus:ring-1 focus:ring-arch-blue/50 w-fit"
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-arch-text3 uppercase tracking-wider">
            {sections ? "Sections" : "Bullets"}
          </span>
          {sections ? (
            <button
              onClick={removeSections}
              className="text-[11px] font-medium text-arch-text3 hover:text-arch-coral transition-colors"
            >
              Remove Sections
            </button>
          ) : (
            <button
              onClick={addSections}
              className="text-[11px] font-medium text-arch-text3 hover:text-arch-blue transition-colors"
            >
              Add Sections
            </button>
          )}
        </div>

        {sections ? (
          <>
            {sections.map((section, i) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(s) => updateSection(i, s)}
                onRemove={() => removeSection(i)}
              />
            ))}
            <button
              onClick={addSection}
              className="flex items-center gap-1.5 text-[11px] font-medium text-arch-text3 hover:text-arch-blue transition-colors w-fit"
            >
              <Plus size={12} /> Add section
            </button>
          </>
        ) : (
          <>
            {bullets.map((bullet, i) => (
              <BulletEditor
                key={i}
                bullet={bullet}
                onChange={(b) => updateBullet(i, b)}
                onRemove={() => removeBullet(i)}
              />
            ))}
            <button
              onClick={addBullet}
              className="flex items-center gap-1.5 text-[11px] font-medium text-arch-text3 hover:text-arch-blue transition-colors w-fit"
            >
              <Plus size={12} /> Add bullet
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-arch-text3 uppercase tracking-wider">
          Full text (optional)
        </span>
        <textarea
          value={fullText}
          onChange={(e) => setFullText(e.target.value)}
          rows={3}
          className="bg-arch-bg1 border border-arch-border rounded-lg px-3 py-2 text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50 resize-y"
          placeholder="Full answer text (expanded view)"
        />
      </div>

      <div className="flex items-center justify-between border-t border-arch-border pt-3">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-arch-coral hover:bg-arch-coral/10 rounded-lg transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-[12px] font-medium text-arch-text3 hover:text-arch-text bg-arch-bg3 border border-arch-border rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-arch-blue hover:bg-arch-blue/90 rounded-lg transition-colors"
          >
            <Check size={12} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function NavigationControls({
  currentIndex,
  total,
  onPrev,
  onNext,
  onGoTo,
}: {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrev}
        className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
        title="Previous card"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-arch-blue scale-125"
                  : "bg-arch-bg3 hover:bg-arch-text3"
              }`}
              title={`Go to card ${i + 1}`}
            />
          ))}
        </div>
        <span className="text-[11px] text-arch-text3 tabular-nums">
          {currentIndex + 1} of {total}
        </span>
      </div>

      <button
        onClick={onNext}
        className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
        title="Next card"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function CardOverview({
  cards,
  currentIndex,
  onSelect,
}: {
  cards: TeleprompterCard[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <button
          key={card.id}
          onClick={() => onSelect(i)}
          className={`text-left p-4 rounded-xl border transition-all hover:shadow-md hover:scale-[1.02] ${
            i === currentIndex
              ? "bg-arch-bg2 border-arch-blue/40 shadow-md ring-1 ring-arch-blue/20"
              : "bg-arch-bg2 border-arch-border hover:border-arch-text3/30"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[11px] font-medium text-arch-text3 tabular-nums">
              {i + 1}
            </span>
            <CategoryBadge category={card.category} size="sm" />
          </div>
          <h3 className="text-[13px] font-semibold text-arch-text leading-snug mb-2">
            {card.title}
          </h3>
          <ul className="flex flex-col gap-1">
            {getAllBullets(card).slice(0, 3).map((bullet, j) => {
              const preview = bullet.text
                .replace(/\*\*/g, "")
                .slice(0, 50);
              return (
                <li
                  key={j}
                  className="flex items-start gap-1.5 text-[11px] text-arch-text3 leading-snug"
                >
                  <span
                    className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${COLOR_BG_CLASSES[bullet.color]} ring-1 ${COLOR_RING_CLASSES[bullet.color]}`}
                  />
                  <span className="line-clamp-1">
                    {preview}
                    {bullet.text.replace(/\*\*/g, "").length > 50 ? "..." : ""}
                  </span>
                </li>
              );
            })}
            {getAllBullets(card).length > 3 && (
              <li className="text-[10px] text-arch-text3 pl-2.5">
                +{getAllBullets(card).length - 3} more
              </li>
            )}
          </ul>
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TeleprompterTab() {
  const {
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
  } = useTeleprompterCards();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (isEditing) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, goNext, goPrev]);

  const handleAddCard = () => {
    addCard({
      title: "New Card",
      category: "Opening",
      bullets: [{ text: "**Key point** — add your content here", color: "blue" }],
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (
    updates: Partial<Omit<TeleprompterCard, "id">>
  ) => {
    updateCard(currentCard.id, updates);
    setIsEditing(false);
  };

  const handleDeleteCard = () => {
    setConfirmDelete(false);
    deleteCard(currentCard.id);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-arch-purple/15 flex items-center justify-center">
            <Monitor size={14} className="text-arch-purple" />
          </div>
          <h1 className="text-[14px] font-semibold text-arch-text">
            Teleprompter
          </h1>
          <span className="text-[11px] text-arch-text3">
            Quick-glance interview cards
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowOverview(!showOverview)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
              showOverview
                ? "text-arch-blue bg-arch-blue/10"
                : "text-arch-text3 hover:text-arch-text hover:bg-arch-bg3"
            }`}
            title={showOverview ? "Focus view" : "Overview"}
          >
            {showOverview ? (
              <><Presentation size={12} /> Focus</>
            ) : (
              <><LayoutGrid size={12} /> Overview</>
            )}
          </button>
          {!isEditing && !showOverview && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
              title="Edit current card"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          <button
            onClick={handleAddCard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
            title="Add new card"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {showOverview ? (
        /* Overview grid */
        <div className="flex-1 overflow-auto p-5">
          <CardOverview
            cards={cards}
            currentIndex={currentIndex}
            onSelect={(i) => {
              goTo(i);
              setShowOverview(false);
              setIsEditing(false);
            }}
          />
        </div>
      ) : (
        <>
          {/* Card area */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <div className="w-full max-w-4xl bg-arch-bg2 border border-arch-border rounded-2xl shadow-lg shadow-black/10 p-8 md:p-10">
              {isEditing ? (
                <CardEditor
                  card={currentCard}
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                  onDelete={() => setConfirmDelete(true)}
                />
              ) : (
                <CardView
                  card={currentCard}
                  onEdit={() => setIsEditing(true)}
                />
              )}
            </div>
          </div>

          {/* Footer navigation */}
          <div className="px-5 py-3 border-t border-arch-border">
            <NavigationControls
              currentIndex={currentIndex}
              total={cards.length}
              onPrev={goPrev}
              onNext={goNext}
              onGoTo={goTo}
            />
          </div>
        </>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Card"
        message={`Are you sure you want to delete "${currentCard.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCard}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
