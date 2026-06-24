"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Pencil,
  Monitor,
  Trash2,
  Check,
  X,
  LayoutGrid,
  Presentation,
  Copy,
  FileText,
  FileStack,
  GripVertical,
  Search,
  Briefcase,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTeleprompterCards } from "@/lib/hooks/useTeleprompterCards";
import {
  type TeleprompterCard,
  type HighlightedPhrase,
  type CardCategory,
  type CardSection,
  type HighlightColor,
  CATEGORY_COLORS,
  getAllBullets,
  TEMPLATE_CARDS,
  DEFAULT_ROLE,
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
  "Past Roles",
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

function CompactHighlightedBullet({ phrase }: { phrase: HighlightedPhrase }) {
  const parts = phrase.text.split(/(\*\*.*?\*\*)/g);
  return (
    <li className="flex items-start gap-1.5 text-[11px] text-arch-text2 leading-snug">
      <span
        className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${COLOR_BG_CLASSES[phrase.color]} ring-1 ${COLOR_RING_CLASSES[phrase.color]}`}
      />
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span
                key={i}
                className={`font-semibold ${COLOR_TEXT_CLASSES[phrase.color]}`}
              >
                {part.slice(2, -2)}
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
  cardIndex,
  totalCards,
  onEdit,
  onClone,
  onPresent,
}: {
  card: TeleprompterCard;
  cardIndex: number;
  totalCards: number;
  onEdit: () => void;
  onClone: () => void;
  onPresent: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-arch-text leading-tight text-[20px]">
            {card.title}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onClone}
            className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
            title="Clone card"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
            title="Edit card"
          >
            <Pencil size={16} />
          </button>
        </div>
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
  roles,
  onSave,
  onCancel,
  onDelete,
}: {
  card: TeleprompterCard;
  roles: string[];
  onSave: (updates: Partial<Omit<TeleprompterCard, "id">>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [category, setCategory] = useState<CardCategory>(card.category);
  // "" = shared across all roles.
  const [role, setRole] = useState<string>(card.role ?? "");
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
        role: role || undefined,
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
        role: role || undefined,
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
        <div className="flex items-center gap-2">
          <Briefcase size={13} className="text-arch-purple shrink-0" />
          <span className="text-[11px] font-medium text-arch-text3 uppercase tracking-wider">
            Role
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-arch-bg1 border border-arch-border rounded-lg px-2 py-1.5 text-[12px] text-arch-text focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
          >
            <option value="">Shared (all roles)</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
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

function SortableCardItem({
  card,
  index,
  isCurrent,
  onSelect,
}: {
  card: TeleprompterCard;
  index: number;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const allBullets = getAllBullets(card);
  const hasMore = allBullets.length > 3;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`text-left p-4 rounded-xl border transition-all hover:shadow-md ${
        isCurrent
          ? "bg-arch-bg2 border-arch-blue/40 shadow-md ring-1 ring-arch-blue/20"
          : "bg-arch-bg2 border-arch-border hover:border-arch-text3/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <button
            className="cursor-grab active:cursor-grabbing text-arch-text3 hover:text-arch-text touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={12} />
          </button>
          <span className="text-[11px] font-medium text-arch-text3 tabular-nums">
            {index + 1}
          </span>
        </div>
        <CategoryBadge category={card.category} size="sm" />
      </div>
      <button onClick={onSelect} className="text-left w-full">
        <h3 className="text-[13px] font-semibold text-arch-text leading-snug mb-2">
          {card.title}
        </h3>
        {expanded ? (
          <ul className="flex flex-col gap-1.5">
            {allBullets.map((bullet, j) => (
              <CompactHighlightedBullet key={j} phrase={bullet} />
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-1">
            {allBullets.slice(0, 3).map((bullet, j) => {
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
          </ul>
        )}
      </button>
      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-2 flex items-center gap-1 text-[11px] font-medium text-arch-text3 hover:text-arch-text transition-colors"
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Show less" : `Show ${allBullets.length - 3} more`}
        </button>
      )}
    </div>
  );
}

function CardOverview({
  cards,
  currentIndex,
  onSelect,
  onReorder,
}: {
  cards: TeleprompterCard[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cards.map((card, i) => (
            <SortableCardItem
              key={card.id}
              card={card}
              index={i}
              isCurrent={i === currentIndex}
              onSelect={() => onSelect(i)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ── Presentation overlay ──────────────────────────────────────────────────

function PresentationBullet({ phrase }: { phrase: HighlightedPhrase }) {
  const parts = phrase.text.split(/(\*\*.*?\*\*)/g);
  return (
    <li className="flex items-start gap-4 text-[22px] md:text-[26px] leading-relaxed text-arch-text2">
      <span
        className={`mt-3 w-3 h-3 rounded-full shrink-0 ${COLOR_BG_CLASSES[phrase.color]} ring-2 ${COLOR_RING_CLASSES[phrase.color]}`}
      />
      <span>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const keyword = part.slice(2, -2);
            return (
              <span
                key={i}
                className={`font-bold text-[1.1em] ${COLOR_TEXT_CLASSES[phrase.color]} animate-keyword-glow`}
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

function PresentationOverlay({
  card,
  currentIndex,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  card: TeleprompterCard;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-arch-bg1">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-arch-border/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <CategoryBadge category={card.category} />
          <span className="text-[14px] text-arch-text3 tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[12px] text-arch-text3 mr-2">
            ESC to exit
          </span>
          <button
            onClick={onClose}
            className="p-2.5 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
            title="Exit presentation (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start sm:items-center justify-center overflow-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="w-full max-w-5xl">
          <h1 className="font-bold text-arch-text text-[28px] sm:text-[32px] md:text-[40px] leading-tight mb-6 sm:mb-10">
            {card.title}
          </h1>

          {card.sections && card.sections.length > 0 ? (
            <div className="flex flex-col gap-10">
              {card.sections.map((section) => (
                <div key={section.id}>
                  <h2 className="text-[18px] md:text-[20px] font-semibold text-arch-text3 uppercase tracking-wider mb-5">
                    {section.name}
                  </h2>
                  <ul className="flex flex-col gap-5 pl-1">
                    {section.bullets.map((bullet, i) => (
                      <PresentationBullet key={i} phrase={bullet} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-6 pl-1">
              {card.bullets.map((bullet, i) => (
                <PresentationBullet key={i} phrase={bullet} />
              ))}
            </ul>
          )}

          {card.fullText && (
            <div className="border-t border-arch-border mt-10 pt-8">
              <p className="text-[18px] md:text-[20px] leading-relaxed text-arch-text3 whitespace-pre-wrap">
                {card.fullText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-arch-border/50">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 active:bg-arch-bg3 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        <div className="hidden sm:flex items-center gap-2">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-arch-blue scale-125"
                  : "bg-arch-bg3"
              }`}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 text-[14px] text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
        >
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ── Role switcher ──────────────────────────────────────────────────────────

function RoleSwitcher({
  activeRole,
  roles,
  defaultRole,
  onSelect,
  onAdd,
  onDelete,
}: {
  activeRole: string;
  roles: string[];
  defaultRole: string;
  onSelect: (role: string) => void;
  onAdd: (name: string) => void;
  onDelete: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const submitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
    setAdding(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-arch-text2 hover:text-arch-text bg-arch-bg3 border border-arch-border rounded-lg transition-colors max-w-[180px]"
        title="Switch interview role"
      >
        <Briefcase size={12} className="text-arch-purple shrink-0" />
        <span className="truncate">{activeRole}</span>
        <ChevronDown size={10} className="shrink-0" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-60 bg-arch-bg2 border border-arch-border rounded-xl shadow-lg shadow-black/15 py-1 z-50">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-arch-text3">
            Role
          </div>
          {roles.map((role) => (
            <div
              key={role}
              className={`group flex items-center gap-2 px-3 py-2 text-[12px] transition-colors ${
                role === activeRole
                  ? "text-arch-purple bg-arch-purple/10"
                  : "text-arch-text hover:bg-arch-bg3"
              }`}
            >
              <button
                onClick={() => {
                  onSelect(role);
                  setOpen(false);
                }}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
              >
                {role === activeRole ? (
                  <Check size={12} className="shrink-0" />
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                <span className="truncate">{role}</span>
              </button>
              {role !== defaultRole && (
                <button
                  onClick={() => onDelete(role)}
                  title={`Delete role "${role}"`}
                  className="opacity-0 group-hover:opacity-100 text-arch-text3 hover:text-arch-coral transition-all shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          <div className="border-t border-arch-border mt-1 pt-1">
            {adding ? (
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAdd();
                    if (e.key === "Escape") { setAdding(false); setNewName(""); }
                  }}
                  placeholder="Role name…"
                  className="flex-1 min-w-0 bg-arch-bg1 border border-arch-border rounded-md px-2 py-1 text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
                />
                <button
                  onClick={submitAdd}
                  className="p-1 text-arch-green hover:bg-arch-green/10 rounded transition-colors"
                  title="Add role"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setAdding(false); setNewName(""); }}
                  className="p-1 text-arch-text3 hover:text-arch-text transition-colors"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-arch-blue hover:bg-arch-bg3 transition-colors"
              >
                <Plus size={14} /> Add role…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TeleprompterTab() {
  const {
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
    activeRole,
    roles,
    setActiveRole,
    addRole,
    deleteRole,
  } = useTeleprompterCards();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showOverview, setShowOverview] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // ── Category + search filter state ──────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<CardCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Map filtered index → real index in the full cards array. Returns null when
  // no filter is active (filtered index === real index). Built first so that
  // filteredCards is always derived from — and consistent with — the map.
  const filteredIndexMap = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const hasFilter = !!activeCategory || q.length > 0;
    if (!hasFilter) return null;

    const matches = (card: TeleprompterCard) => {
      if (activeCategory && card.category !== activeCategory) return false;
      if (!q) return true;
      if (card.title.toLowerCase().includes(q)) return true;
      if (card.fullText?.toLowerCase().includes(q)) return true;
      if (card.sections?.some((s) => s.name.toLowerCase().includes(q))) return true;
      return getAllBullets(card).some((b) => b.text.toLowerCase().includes(q));
    };

    const map: number[] = [];
    cards.forEach((card, realIndex) => {
      if (matches(card)) map.push(realIndex);
    });
    return map;
  }, [cards, activeCategory, searchQuery]);

  const filteredCards = useMemo(
    () => (filteredIndexMap ? filteredIndexMap.map((i) => cards[i]) : cards),
    [cards, filteredIndexMap]
  );

  // Current card's position in the filtered list (for highlight)
  const filteredCurrentIndex = useMemo(() => {
    if (!filteredIndexMap) return currentIndex;
    if (!currentCard) return -1;
    return filteredCards.findIndex((c) => c.id === currentCard.id);
  }, [filteredIndexMap, currentIndex, filteredCards, currentCard]);

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

  // Close add menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAddMenu]);

  const handleAddCard = () => {
    addCard({
      title: "New Card",
      category: "Opening",
      bullets: [{ text: "**Key point** — add your content here", color: "blue" }],
    });
    setIsEditing(true);
    setShowAddMenu(false);
  };

  const handleAddFromTemplate = (template: Omit<TeleprompterCard, "id">) => {
    addCard(template);
    setIsEditing(true);
    setShowTemplatePicker(false);
    setShowAddMenu(false);
  };

  const handleCloneCard = () => {
    cloneCard(currentCard.id);
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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
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
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-arch-blue/30 border-t-arch-blue rounded-full animate-spin" />
            <span className="text-[12px] text-arch-text3">Loading cards...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-arch-border">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-arch-purple/15 flex items-center justify-center shrink-0">
            <Monitor size={14} className="text-arch-purple" />
          </div>
          <h1 className="text-[14px] font-semibold text-arch-text shrink-0">
            Teleprompter
          </h1>
          <span className="hidden md:inline text-[11px] text-arch-text3 truncate">
            Quick-glance interview cards
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <RoleSwitcher
            activeRole={activeRole}
            roles={roles}
            defaultRole={DEFAULT_ROLE}
            onSelect={setActiveRole}
            onAdd={addRole}
            onDelete={(role) => {
              if (
                window.confirm(
                  `Delete the "${role}" role and its role-specific cards? Shared cards are not affected.`
                )
              ) {
                deleteRole(role);
              }
            }}
          />
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
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
              title="Add new card"
            >
              <Plus size={12} /> Add <ChevronDown size={10} />
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-arch-bg2 border border-arch-border rounded-xl shadow-lg shadow-black/15 py-1 z-50">
                <button
                  onClick={handleAddCard}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-arch-text hover:bg-arch-bg3 transition-colors"
                >
                  <FileText size={14} className="text-arch-text3" />
                  Blank Card
                </button>
                <button
                  onClick={() => { setShowTemplatePicker(true); setShowAddMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-arch-text hover:bg-arch-bg3 transition-colors"
                >
                  <FileStack size={14} className="text-arch-text3" />
                  From Template...
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumbs — reflects the tab's internal navigation state */}
      <nav
        key={
          showOverview
            ? `ov-${activeCategory ?? "all"}-${searchQuery.trim()}`
            : `card-${currentCard?.id ?? "none"}`
        }
        className="flex items-center gap-1.5 px-3 sm:px-5 py-2 border-b border-arch-border text-[11px] animate-breadcrumb-in"
      >
        <button
          onClick={() => setShowOverview(true)}
          className="flex items-center gap-1 font-semibold text-arch-purple hover:text-arch-purple/70 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Monitor className="w-3 h-3" />
          Teleprompter
        </button>
        {showOverview ? (
          <>
            <ChevronRight className="w-3 h-3 text-arch-text3/50" />
            {activeCategory || searchQuery.trim() ? (
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery("");
                }}
                className="font-medium text-arch-blue hover:text-arch-blue/70 hover:-translate-y-0.5 transition-all duration-200"
              >
                Overview
              </button>
            ) : (
              <span className="font-medium text-arch-text2">Overview</span>
            )}
            {activeCategory && (
              <>
                <ChevronRight className="w-3 h-3 text-arch-text3/50" />
                <CategoryBadge category={activeCategory} size="sm" />
              </>
            )}
            {searchQuery.trim() && (
              <>
                <ChevronRight className="w-3 h-3 text-arch-text3/50" />
                <span className="inline-flex items-center gap-1 rounded-full bg-arch-blue/10 text-arch-blue border border-arch-blue/30 px-2.5 py-0.5 font-medium">
                  <Search className="w-3 h-3" />
                  &ldquo;{searchQuery.trim()}&rdquo;
                </span>
              </>
            )}
          </>
        ) : (
          currentCard && (
            <>
              <ChevronRight className="w-3 h-3 text-arch-text3/50" />
              <button
                onClick={() => setShowOverview(true)}
                className="font-medium text-arch-blue hover:text-arch-blue/70 hover:-translate-y-0.5 transition-all duration-200"
              >
                Overview
              </button>
              <ChevronRight className="w-3 h-3 text-arch-text3/50" />
              <button
                onClick={() => {
                  setActiveCategory(currentCard.category);
                  setSearchQuery("");
                  setShowOverview(true);
                }}
                className="hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200"
                title={`Show all ${currentCard.category} cards`}
              >
                <CategoryBadge category={currentCard.category} size="sm" />
              </button>
              <ChevronRight className="w-3 h-3 text-arch-text3/50" />
              <span className="font-semibold text-arch-text truncate max-w-[220px]">
                {currentCard.title}
              </span>
            </>
          )
        )}
      </nav>

      {showOverview ? (
        /* Overview grid */
        <div className="flex-1 overflow-auto p-3 sm:p-5">
          {/* Search + category filter bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5 border border-arch-border rounded-lg px-2.5 py-1.5 bg-arch-bg3 w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-arch-text3 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards…"
                className="flex-1 min-w-0 bg-transparent text-[12px] text-arch-text placeholder:text-arch-text3 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                  className="text-arch-text3 hover:text-arch-text shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${
                !activeCategory
                  ? "bg-arch-text/10 text-arch-text border-arch-text/25"
                  : "bg-transparent border-arch-border text-arch-text3 hover:text-arch-text hover:border-arch-text/25"
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${
                  activeCategory === cat
                    ? "bg-arch-text/10 text-arch-text border-arch-text/25"
                    : "bg-transparent border-arch-border text-arch-text3 hover:text-arch-text hover:border-arch-text/25"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-[11px] text-arch-text3 ml-auto">
              {filteredCards.length} of {cards.length}
            </span>
          </div>
          {filteredCards.length > 0 ? (
            <CardOverview
              cards={filteredCards}
              currentIndex={filteredCurrentIndex}
              onSelect={(filteredIdx) => {
                const realIdx = filteredIndexMap ? filteredIndexMap[filteredIdx] : filteredIdx;
                goTo(realIdx);
                setShowOverview(false);
                setIsEditing(false);
              }}
              onReorder={(fromFiltered, toFiltered) => {
                const realFrom = filteredIndexMap ? filteredIndexMap[fromFiltered] : fromFiltered;
                const realTo = filteredIndexMap ? filteredIndexMap[toFiltered] : toFiltered;
                moveCard(realFrom, realTo);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[13px] text-arch-text3">
                {searchQuery.trim()
                  ? `No cards match "${searchQuery.trim()}"`
                  : `No ${activeCategory} cards yet`}
              </p>
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery("");
                }}
                className="mt-2 text-[12px] text-arch-blue hover:underline"
              >
                Show all cards
              </button>
            </div>
          )}
        </div>
      ) : !currentCard ? (
        /* Empty deck for this role */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Briefcase size={28} className="text-arch-purple/50" />
          <p className="mt-3 text-[13px] text-arch-text3">
            No cards for the <span className="font-semibold text-arch-text">{activeRole}</span> role yet.
          </p>
          <button
            onClick={handleAddCard}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-arch-blue hover:bg-arch-blue/90 rounded-lg transition-colors"
          >
            <Plus size={12} /> Add a card
          </button>
        </div>
      ) : (
        <>
          {/* Card area */}
          <div className="flex-1 flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-auto">
            <div className="w-full max-w-4xl bg-arch-bg2 border border-arch-border rounded-2xl shadow-lg shadow-black/10 p-5 sm:p-8 md:p-10">
              {isEditing ? (
                <CardEditor
                  card={currentCard}
                  roles={roles}
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                  onDelete={() => setConfirmDelete(true)}
                />
              ) : (
                <CardView
                  card={currentCard}
                  cardIndex={currentIndex}
                  totalCards={cards.length}
                  onEdit={() => setIsEditing(true)}
                  onClone={handleCloneCard}
                  onPresent={() => setPresenting(true)}
                />
              )}
            </div>
          </div>

          {/* Footer navigation */}
          <div className="px-3 sm:px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-arch-border">
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
        message={`Are you sure you want to delete "${currentCard?.title ?? "this card"}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCard}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Presentation overlay — portaled to body to escape stacking contexts */}
      {presenting &&
        createPortal(
          <PresentationOverlay
            card={currentCard}
            currentIndex={currentIndex}
            total={cards.length}
            onClose={() => setPresenting(false)}
            onPrev={goPrev}
            onNext={goNext}
          />,
          document.body
        )}

      {/* Template picker modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 bg-arch-bg2 border border-arch-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-arch-border">
              <div>
                <h2 className="text-[16px] font-semibold text-arch-text">Choose a Template</h2>
                <p className="text-[12px] text-arch-text3 mt-0.5">Pick a starting point and customize it</p>
              </div>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATE_CARDS.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddFromTemplate(template)}
                    className="text-left p-4 rounded-xl border border-arch-border bg-arch-bg1 hover:border-arch-text3/30 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CategoryBadge category={template.category} size="sm" />
                    </div>
                    <h3 className="text-[13px] font-semibold text-arch-text leading-snug mb-2">
                      {template.title}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {getAllBullets(template as TeleprompterCard).slice(0, 3).map((bullet, j) => {
                        const preview = bullet.text.replace(/\*\*/g, "").slice(0, 55);
                        return (
                          <li key={j} className="flex items-start gap-1.5 text-[11px] text-arch-text3 leading-snug">
                            <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${COLOR_BG_CLASSES[bullet.color]} ring-1 ${COLOR_RING_CLASSES[bullet.color]}`} />
                            <span className="line-clamp-1">{preview}{bullet.text.replace(/\*\*/g, "").length > 55 ? "..." : ""}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
