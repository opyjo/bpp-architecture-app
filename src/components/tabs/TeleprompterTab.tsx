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
  Users,
  Tag,
  Settings2,
  Brain,
  Star,
  Sparkles,
  Loader2,
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
  type CategoryColor,
  type CategoryDef,
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_DOT_CLASSES,
  resolveCategoryClass,
  categoryDescription,
  getAllBullets,
  TEMPLATE_CARDS,
  MENTAL_MODEL_TEMPLATE,
  type CardMentalModel,
  type MentalModelBeat,
} from "@/data/teleprompter-defaults";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { STAR_MENTAL_MODELS } from "@/data/star-mental-models";
import StarMentalModelView from "@/components/star/StarMentalModelView";

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

function CategoryBadge({
  category,
  colorClass,
  size = "lg",
}: {
  category: CardCategory;
  colorClass: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${colorClass} ${
        size === "sm"
          ? "px-2.5 py-0.5 text-[11px]"
          : "px-3.5 py-1 text-[14px]"
      }`}
    >
      {category}
    </span>
  );
}

// Marks a card that isn't role-specific — it shows up in every role's deck.
function SharedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-medium border bg-arch-text/8 text-arch-text3 border-arch-text/15 px-2.5 py-0.5 text-[11px]"
      title="Shared — shows for every role"
    >
      <Users size={10} className="shrink-0" />
      Shared
    </span>
  );
}

function CardView({
  card,
  cardIndex,
  totalCards,
  roles,
  onEdit,
  onClone,
  onPresent,
  onMentalModel,
}: {
  card: TeleprompterCard;
  cardIndex: number;
  totalCards: number;
  roles: string[];
  // undefined → keep this card's role; "" → Shared; otherwise that role.
  onClone: (targetRole?: string) => void;
  onEdit: () => void;
  onPresent: () => void;
  onMentalModel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const cloneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cloneOpen) return;
    function handleClick(e: MouseEvent) {
      if (cloneRef.current && !cloneRef.current.contains(e.target as Node)) {
        setCloneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [cloneOpen]);

  // Roles you can copy into, minus this card's current placement.
  const currentPlacement = card.role ?? "";
  const copyTargets = [
    { value: "", label: "Shared (all roles)" },
    ...roles.map((r) => ({ value: r, label: r })),
  ].filter((t) => t.value !== currentPlacement);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-arch-text leading-tight text-[20px]">
            {card.title}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-arch-text3">
            <Briefcase size={11} className="text-arch-purple shrink-0" />
            <span className="truncate">{card.role ?? "Shared — shows for every role"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={cloneRef}>
            <button
              onClick={() => setCloneOpen((o) => !o)}
              className="flex items-center gap-0.5 p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
              title="Duplicate card"
            >
              <Copy size={16} />
              <ChevronDown size={11} className="-mr-0.5" />
            </button>
            {cloneOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-arch-bg2 border border-arch-border rounded-xl shadow-lg shadow-black/15 py-1 z-50">
                <button
                  onClick={() => { onClone(undefined); setCloneOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-arch-text hover:bg-arch-bg3 transition-colors text-left"
                >
                  <Copy size={13} className="shrink-0 text-arch-text3" />
                  Duplicate here
                </button>
                {copyTargets.length > 0 && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-arch-text3">
                      Duplicate into
                    </div>
                    {copyTargets.map((t) => (
                      <button
                        key={t.value || "__shared__"}
                        onClick={() => { onClone(t.value); setCloneOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-arch-text hover:bg-arch-bg3 transition-colors text-left"
                      >
                        <Briefcase size={13} className="shrink-0 text-arch-purple" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onMentalModel}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg transition-colors ${
              card.mentalModel
                ? "text-arch-purple bg-arch-purple/10 hover:bg-arch-purple/15"
                : "text-arch-text3 hover:text-arch-text hover:bg-arch-bg3"
            }`}
            title={card.mentalModel ? "View / edit mental model" : "Add a mental model"}
          >
            <Brain size={16} />
            <span className="text-[11px] font-medium">Mental Model</span>
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
  categories,
  onSave,
  onCancel,
  onDelete,
}: {
  card: TeleprompterCard;
  roles: string[];
  categories: CategoryDef[];
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-arch-blue shrink-0" />
            <span className="text-[11px] font-medium text-arch-text3 uppercase tracking-wider">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-arch-bg1 border border-arch-border rounded-lg px-2 py-1.5 text-[12px] text-arch-text focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
              {!categories.some((c) => c.name === category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>
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
  colorClass,
  onSelect,
}: {
  card: TeleprompterCard;
  index: number;
  isCurrent: boolean;
  colorClass: string;
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
        <div className="flex items-center gap-1 shrink-0">
          {!card.role && <SharedBadge />}
          <CategoryBadge category={card.category} colorClass={colorClass} size="sm" />
        </div>
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
  categoryClass,
  onSelect,
  onReorder,
}: {
  cards: TeleprompterCard[];
  currentIndex: number;
  categoryClass: (name: string) => string;
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
              colorClass={categoryClass(card.category)}
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
  colorClass,
  onClose,
  onPrev,
  onNext,
  onMentalModel,
}: {
  card: TeleprompterCard;
  currentIndex: number;
  total: number;
  colorClass: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onMentalModel: () => void;
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-arch-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-arch-border/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <CategoryBadge category={card.category} colorClass={colorClass} />
          <span className="text-[14px] text-arch-text3 tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMentalModel}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
              card.mentalModel
                ? "text-arch-purple bg-arch-purple/10 hover:bg-arch-purple/15"
                : "text-arch-text3 hover:text-arch-text hover:bg-arch-bg3"
            }`}
            title={card.mentalModel ? "View / edit mental model" : "Add a mental model"}
          >
            <Brain size={16} />
            <span className="hidden sm:inline text-[12px] font-medium">Mental Model</span>
          </button>
          <span className="hidden sm:inline text-[12px] text-arch-text3 mx-2">
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

// ── Mental Models overlay ──────────────────────────────────────────────────
// A full-screen deck over the static STAR mental models (spine + named beats),
// independent of the editable/DB-backed cards. Mirrors PresentationOverlay chrome.

function MentalModelOverlay({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const total = STAR_MENTAL_MODELS.length;
  const model = STAR_MENTAL_MODELS[index];

  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total]
  );
  const goNext = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!model) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-arch-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-arch-border/50">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-arch-purple/30 bg-arch-purple/15 px-3.5 py-1 text-[14px] font-medium text-arch-purple">
            <Brain size={14} /> Mental Model
          </span>
          <span className="text-[14px] text-arch-text3 tabular-nums">
            {index + 1} / {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[12px] text-arch-text3 mr-2">
            ESC to exit
          </span>
          <button
            onClick={onClose}
            className="p-2.5 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
            title="Exit (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start sm:items-center justify-center overflow-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="w-full max-w-4xl">
          <h1 className="font-bold text-arch-text text-[28px] sm:text-[32px] md:text-[40px] leading-tight mb-6 sm:mb-10">
            {model.title}
          </h1>
          <StarMentalModelView model={model} variant="presentation" />
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-arch-border/50">
        <button
          onClick={goPrev}
          className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 active:bg-arch-bg3 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        <div className="hidden sm:flex items-center gap-2">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === index ? "bg-arch-purple scale-125" : "bg-arch-bg3"
              }`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          className="flex items-center gap-2 px-4 py-2 text-[14px] text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
        >
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ── Per-card mental model modal (view + edit) ──────────────────────────────

// STAR / story cards keep the manual spine+beats format (no AI). Everything
// else gets the "Generate with AI" path. Match on category, case-insensitive.
function isStoryCard(card: TeleprompterCard): boolean {
  const k = card.category.trim().toLowerCase();
  return k === "star" || k === "stories" || k.includes("star");
}

// Extract a CardMentalModel from a (possibly fenced) AI JSON response.
function parseMentalModelJSON(raw: string): CardMentalModel | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const rec = obj as { spine?: unknown; beats?: unknown };
  const rawBeats = Array.isArray(rec.beats) ? rec.beats : [];
  const beats: MentalModelBeat[] = rawBeats
    .map((b) => {
      const rb = (b ?? {}) as { hook?: unknown; say?: unknown; crux?: unknown };
      return {
        hook: String(rb.hook ?? "").trim(),
        say: String(rb.say ?? "").trim(),
        crux: Boolean(rb.crux),
      };
    })
    .filter((b) => b.hook || b.say);
  if (beats.length === 0) return null;
  return { spine: String(rec.spine ?? "").trim(), beats };
}

function CardMentalModelModal({
  card,
  onSave,
  onDelete,
  onClose,
}: {
  card: TeleprompterCard;
  onSave: (model: CardMentalModel) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const story = isStoryCard(card);
  // Start in view mode if the card already has a model; otherwise straight into
  // editing. Story cards seed from the STAR template; other cards start minimal
  // (their structure comes from AI or the user, not the STAR skeleton).
  const [editing, setEditing] = useState(!card.mentalModel);
  const [model, setModel] = useState<CardMentalModel>(() =>
    structuredClone(
      card.mentalModel ??
        (story ? MENTAL_MODEL_TEMPLATE : { spine: "", beats: [{ hook: "", say: "" }] })
    )
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const generateWithAI = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const bulletsText = getAllBullets(card)
        .map((b) => b.text.replace(/\*\*/g, ""))
        .join("\n");
      const res = await fetch("/api/mental-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: card.title,
          bulletsText,
          fullText: card.fullText ?? "",
          category: card.category,
        }),
      });
      if (!res.ok || !res.body) {
        const e = await res.json().catch(() => null);
        throw new Error(e?.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt: { type?: string; text?: string; message?: string };
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          if (evt.type === "text_delta") text += evt.text ?? "";
          else if (evt.type === "error") throw new Error(evt.message || "Generation failed");
        }
      }
      const parsed = parseMentalModelJSON(text);
      if (!parsed) throw new Error("Couldn't parse the generated model — try again.");
      setModel(parsed);
      setEditing(true);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const hasContent =
    model.spine.trim().length > 0 ||
    model.beats.some((b) => b.hook.trim() || b.say.trim());

  const setBeat = (i: number, patch: Partial<MentalModelBeat>) =>
    setModel((m) => ({
      ...m,
      beats: m.beats.map((b, j) => (j === i ? { ...b, ...patch } : b)),
    }));

  const addBeat = () =>
    setModel((m) => ({ ...m, beats: [...m.beats, { hook: "", say: "" }] }));

  const removeBeat = (i: number) =>
    setModel((m) => ({ ...m, beats: m.beats.filter((_, j) => j !== i) }));

  const handleSave = () => {
    // Trim and drop fully-empty beats before persisting.
    const cleaned: CardMentalModel = {
      spine: model.spine.trim(),
      beats: model.beats
        .map((b) => ({ hook: b.hook.trim(), say: b.say.trim(), crux: b.crux }))
        .filter((b) => b.hook || b.say),
    };
    onSave(cleaned);
    setModel(structuredClone(cleaned));
    setEditing(false);
  };

  const handleCancelEdit = () => {
    if (card.mentalModel) {
      setModel(structuredClone(card.mentalModel));
      setEditing(false);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-arch-bg2 border border-arch-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-arch-border">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-arch-purple">
              <Brain size={13} /> Mental Model
            </div>
            <h2 className="text-[15px] font-semibold text-arch-text truncate mt-0.5">
              {card.title}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-arch-text2 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
            {card.mentalModel && (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="p-2 text-arch-text3 hover:text-arch-coral hover:bg-arch-bg3 rounded-lg transition-colors"
                title="Delete mental model"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {confirmingDelete && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-arch-coral/30 bg-arch-coral/10 px-3 py-2.5">
              <span className="text-[12.5px] text-arch-text2">
                Delete this mental model? This can&apos;t be undone.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-2.5 py-1.5 text-[12px] font-medium text-arch-text2 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-arch-coral hover:bg-arch-coral/90 rounded-lg transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          )}
          {editing ? (
            <div className="flex flex-col gap-5">
              {/* AI generate — non-story cards only (STAR/stories stay manual) */}
              {!story && (
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={generateWithAI}
                    disabled={generating}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-arch-purple to-arch-blue rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} /> Generate with AI
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-arch-text3 text-center">
                    The AI shapes the model to fit this card — then tweak it below and save.
                  </p>
                  {genError && (
                    <p className="text-[11.5px] text-arch-coral text-center">{genError}</p>
                  )}
                </div>
              )}

              {/* Spine */}
              <div>
                <label className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-arch-amber">
                  <LifeBuoyIcon /> The spine — if you blank
                </label>
                <textarea
                  value={model.spine}
                  onChange={(e) => setModel((m) => ({ ...m, spine: e.target.value }))}
                  placeholder="One fallback sentence — the whole story in one breath."
                  rows={3}
                  className="w-full bg-arch-bg1 border border-arch-border rounded-lg px-3 py-2 text-[13px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50 resize-y"
                />
              </div>

              {/* Beats */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-arch-text3">
                  Beats
                </span>
                {model.beats.map((beat, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-arch-border bg-arch-bg1 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={beat.hook}
                        onChange={(e) => setBeat(i, { hook: e.target.value })}
                        placeholder="HOOK (e.g. STAKES)"
                        className="flex-1 min-w-0 bg-arch-bg2 border border-arch-border rounded-md px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-arch-text placeholder:text-arch-text3 placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
                      />
                      <button
                        onClick={() => setBeat(i, { crux: !beat.crux })}
                        title="Mark as the crux beat"
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          beat.crux
                            ? "text-arch-amber bg-arch-amber/15"
                            : "text-arch-text3 hover:text-arch-text hover:bg-arch-bg3"
                        }`}
                      >
                        <Star
                          size={13}
                          className={beat.crux ? "fill-arch-amber" : ""}
                        />
                        Crux
                      </button>
                      <button
                        onClick={() => removeBeat(i)}
                        title="Remove beat"
                        className="p-1.5 text-arch-text3 hover:text-arch-coral hover:bg-arch-bg3 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={beat.say}
                      onChange={(e) => setBeat(i, { say: e.target.value })}
                      placeholder="What you say — the one line you improvise from."
                      rows={2}
                      className="w-full bg-arch-bg2 border border-arch-border rounded-md px-2 py-1.5 text-[12.5px] text-arch-text2 placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50 resize-y"
                    />
                  </div>
                ))}
                <button
                  onClick={addBeat}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium text-arch-text2 border border-dashed border-arch-border rounded-lg hover:text-arch-text hover:border-arch-text3/40 transition-colors"
                >
                  <Plus size={14} /> Add beat
                </button>
              </div>
            </div>
          ) : hasContent ? (
            <StarMentalModelView model={model} variant="compact" />
          ) : (
            <p className="py-10 text-center text-[13px] text-arch-text3">
              No mental model yet. Click <span className="font-medium text-arch-text2">Edit</span> to add one.
            </p>
          )}
        </div>

        {/* Footer (edit mode) */}
        {editing && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-arch-border">
            <button
              onClick={handleCancelEdit}
              className="px-3.5 py-2 text-[12px] font-medium text-arch-text2 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-arch-purple hover:bg-arch-purple/90 rounded-lg transition-colors"
            >
              <Check size={14} /> Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Small inline life-buoy (lucide LifeBuoy isn't imported here; keep label icon simple).
function LifeBuoyIcon() {
  return <Brain size={12} />;
}

// ── Role picker (landing screen) ───────────────────────────────────────────

function RolePicker({
  roles,
  roleCounts,
  sharedCount,
  activeRole,
  defaultRole,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: {
  roles: string[];
  roleCounts: Record<string, number>;
  sharedCount: number;
  activeRole: string;
  defaultRole: string;
  onSelect: (role: string) => void;
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (role: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const submitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
    setAdding(false);
  };

  const submitRename = () => {
    if (editingRole == null) return;
    const name = editName.trim();
    if (name && name !== editingRole) onRename(editingRole, name);
    setEditingRole(null);
    setEditName("");
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-arch-text">Choose a role</h2>
        <p className="mt-1 text-[12px] text-arch-text3">
          Pick a role to see only its interview cards.
          {sharedCount > 0 && (
            <> {sharedCount} shared card{sharedCount === 1 ? "" : "s"} appear in every role.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map((role) => {
          const isActive = role === activeRole;
          const count = roleCounts[role] ?? 0;
          const isEditing = editingRole === role;
          return (
            <div
              key={role}
              className={`group relative rounded-xl border p-4 transition-all ${
                isActive
                  ? "bg-arch-purple/5 border-arch-purple/40 ring-1 ring-arch-purple/20"
                  : "bg-arch-bg2 border-arch-border hover:border-arch-text3/40 hover:shadow-md"
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") { setEditingRole(null); setEditName(""); }
                    }}
                    className="flex-1 min-w-0 bg-arch-bg1 border border-arch-border rounded-md px-2 py-1 text-[13px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
                  />
                  <button
                    onClick={submitRename}
                    className="p-1 text-arch-green hover:bg-arch-green/10 rounded transition-colors shrink-0"
                    title="Save name"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => { setEditingRole(null); setEditName(""); }}
                    className="p-1 text-arch-text3 hover:text-arch-text transition-colors shrink-0"
                    title="Cancel"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelect(role)}
                    className="flex items-start gap-3 text-left w-full"
                  >
                    <div className="w-9 h-9 rounded-lg bg-arch-purple/15 flex items-center justify-center shrink-0">
                      <Briefcase size={16} className="text-arch-purple" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-arch-text truncate">
                          {role}
                        </span>
                        {isActive && (
                          <Check size={13} className="text-arch-purple shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-arch-text3">
                        {count} card{count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
                    <button
                      onClick={() => { setEditingRole(role); setEditName(role); }}
                      title={`Rename role "${role}"`}
                      className="p-1 opacity-0 group-hover:opacity-100 text-arch-text3 hover:text-arch-blue transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                    {role !== defaultRole && (
                      <button
                        onClick={() => onDelete(role)}
                        title={`Delete role "${role}"`}
                        className="p-1 opacity-0 group-hover:opacity-100 text-arch-text3 hover:text-arch-coral transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Add-role tile */}
        {adding ? (
          <div className="rounded-xl border border-dashed border-arch-border p-4 bg-arch-bg2">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAdd();
                  if (e.key === "Escape") { setAdding(false); setNewName(""); }
                }}
                placeholder="Role name…"
                className="flex-1 min-w-0 bg-arch-bg1 border border-arch-border rounded-md px-2 py-1 text-[13px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
              />
              <button
                onClick={submitAdd}
                className="p-1 text-arch-green hover:bg-arch-green/10 rounded transition-colors shrink-0"
                title="Add role"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(""); }}
                className="p-1 text-arch-text3 hover:text-arch-text transition-colors shrink-0"
                title="Cancel"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-arch-border p-4 text-[13px] font-medium text-arch-text3 hover:text-arch-blue hover:border-arch-blue/40 hover:bg-arch-blue/5 transition-colors min-h-[68px]"
          >
            <Plus size={15} /> Add role
          </button>
        )}
      </div>
    </div>
  );
}

// ── Category manager (modal) ───────────────────────────────────────────────

function ColorDots({
  selected,
  onPick,
  ringOffset,
}: {
  selected: CategoryColor;
  onPick: (color: CategoryColor) => void;
  ringOffset: string;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {CATEGORY_COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          title={color}
          className={`w-3.5 h-3.5 rounded-full ${CATEGORY_DOT_CLASSES[color]} transition-transform hover:scale-110 ${
            selected === color
              ? `ring-2 ring-offset-1 ${ringOffset} ring-arch-text/40`
              : "opacity-50 hover:opacity-100"
          }`}
        />
      ))}
    </div>
  );
}

function CategoryManager({
  categories,
  onAdd,
  onRename,
  onDelete,
  onRecolor,
  onClose,
}: {
  categories: CategoryDef[];
  onAdd: (name: string, color: CategoryColor) => void;
  onRename: (oldName: string, next: string) => void;
  onDelete: (name: string) => void;
  onRecolor: (name: string, color: CategoryColor) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>("blue");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const submitAdd = () => {
    const n = newName.trim();
    if (!n) return;
    onAdd(n, newColor);
    setNewName("");
  };

  const submitRename = () => {
    if (editingName == null) return;
    const n = editValue.trim();
    if (n && n !== editingName) onRename(editingName, n);
    setEditingName(null);
    setEditValue("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-arch-bg2 border border-arch-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-arch-border">
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-arch-blue" />
            <div>
              <h2 className="text-[15px] font-semibold text-arch-text">Manage Categories</h2>
              <p className="text-[11px] text-arch-text3 mt-0.5">
                Add, rename, recolor or remove. Deleting moves its cards to another category.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-arch-text3 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 max-h-[50vh] overflow-auto flex flex-col gap-2">
          {categories.map((cat) => {
            const isEditing = editingName === cat.name;
            return (
              <div
                key={cat.name}
                className="flex items-center gap-2 rounded-lg border border-arch-border bg-arch-bg1 px-3 py-2"
              >
                <ColorDots
                  selected={cat.color}
                  onPick={(color) => onRecolor(cat.name, color)}
                  ringOffset="ring-offset-arch-bg1"
                />
                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") {
                        setEditingName(null);
                        setEditValue("");
                      }
                    }}
                    onBlur={submitRename}
                    className="flex-1 min-w-0 bg-arch-bg2 border border-arch-border rounded-md px-2 py-1 text-[13px] text-arch-text focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
                  />
                ) : (
                  <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-arch-text">
                    {cat.name}
                  </span>
                )}
                <button
                  onClick={() => {
                    setEditingName(cat.name);
                    setEditValue(cat.name);
                  }}
                  title={`Rename "${cat.name}"`}
                  className="p-1.5 text-arch-text3 hover:text-arch-blue transition-colors shrink-0"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(cat.name)}
                  disabled={categories.length <= 1}
                  title={`Delete "${cat.name}"`}
                  className="p-1.5 text-arch-text3 hover:text-arch-coral transition-colors shrink-0 disabled:opacity-30 disabled:hover:text-arch-text3"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-arch-border p-4">
          <div className="flex items-center gap-2">
            <ColorDots selected={newColor} onPick={setNewColor} ringOffset="ring-offset-arch-bg2" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAdd();
              }}
              placeholder="New category…"
              className="flex-1 min-w-0 bg-arch-bg1 border border-arch-border rounded-lg px-2.5 py-1.5 text-[13px] text-arch-text placeholder:text-arch-text3 focus:outline-none focus:ring-1 focus:ring-arch-blue/50"
            />
            <button
              onClick={submitAdd}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-arch-blue hover:bg-arch-blue/90 rounded-lg transition-colors disabled:opacity-40 shrink-0"
            >
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      </div>
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
    roleCounts,
    sharedCount,
    defaultRole,
    setActiveRole,
    addRole,
    renameRole,
    deleteRole,
    categories,
    addCategory,
    renameCategory,
    deleteCategory,
    setCategoryColor,
  } = useTeleprompterCards();

  // Resolve a category name → badge classes against the current category set.
  const catClass = useCallback(
    (name: string) => resolveCategoryClass(name, categories),
    [categories]
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  // false → role picker (landing). true → drilled into the active role's deck.
  const [viewingRole, setViewingRole] = useState(false);
  const [showOverview, setShowOverview] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [showMentalModels, setShowMentalModels] = useState(false);
  // The card whose per-card mental model modal is open (null = closed).
  const [mentalModelCard, setMentalModelCard] = useState<TeleprompterCard | null>(null);
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

  // Keyboard navigation — only inside a role's deck, not on the picker.
  useEffect(() => {
    if (isEditing || !viewingRole) return;

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
  }, [isEditing, viewingRole, goNext, goPrev]);

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

  // ── Role navigation ─────────────────────────────────────────────────────
  const enterRole = (role: string) => {
    setActiveRole(role); // persists + resets the deck position
    setShowOverview(true);
    setIsEditing(false);
    setViewingRole(true);
  };
  const backToRoles = () => {
    setViewingRole(false);
    setIsEditing(false);
  };
  const handleDeleteRole = (role: string) => {
    if (
      window.confirm(
        `Delete the "${role}" role and its role-specific cards? Shared cards are not affected.`
      )
    ) {
      deleteRole(role);
    }
  };

  const handleAddCard = () => {
    addCard({
      title: "New Card",
      category: categories[0]?.name ?? "Opening",
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

  const handleCloneCard = (targetRole?: string) => {
    cloneCard(currentCard.id, targetRole);
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

  // Keep the active category filter in sync when a category is renamed/removed.
  const handleRenameCategory = (oldName: string, next: string) => {
    renameCategory(oldName, next);
    const trimmed = next.trim();
    if (trimmed && activeCategory === oldName) setActiveCategory(trimmed);
  };

  const handleDeleteCategory = (name: string) => {
    if (activeCategory === name) setActiveCategory(null);
    deleteCategory(name);
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
          {viewingRole && (
            <>
              <button
                onClick={backToRoles}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-arch-text2 hover:text-arch-text hover:bg-arch-bg3 rounded-lg transition-colors"
                title="Back to all roles"
              >
                <ChevronLeft size={13} /> Roles
              </button>
              <button
                onClick={backToRoles}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-arch-purple bg-arch-purple/10 border border-arch-purple/25 rounded-lg transition-colors max-w-[180px]"
                title="Switch role"
              >
                <Briefcase size={12} className="shrink-0" />
                <span className="truncate">{activeRole}</span>
              </button>
            </>
          )}
          {viewingRole && (
          <>
          <button
            onClick={() => setShowMentalModels(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-arch-purple hover:bg-arch-purple/10 rounded-lg transition-colors"
            title="Rehearse stories as mental models"
          >
            <Brain size={12} /> Mental Models
          </button>
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
          </>
          )}
        </div>
      </div>

      {/* Breadcrumbs — reflects the tab's internal navigation state */}
      {viewingRole && (
      <nav
        key={
          showOverview
            ? `ov-${activeCategory ?? "all"}-${searchQuery.trim()}`
            : `card-${currentCard?.id ?? "none"}`
        }
        className="flex items-center gap-1.5 px-3 sm:px-5 py-2 border-b border-arch-border text-[11px] animate-breadcrumb-in"
      >
        <button
          onClick={backToRoles}
          className="flex items-center gap-1 font-semibold text-arch-purple hover:text-arch-purple/70 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Monitor className="w-3 h-3" />
          Teleprompter
        </button>
        <ChevronRight className="w-3 h-3 text-arch-text3/50" />
        <button
          onClick={backToRoles}
          className="inline-flex items-center gap-1 font-medium text-arch-purple hover:text-arch-purple/70 hover:-translate-y-0.5 transition-all duration-200"
          title="Back to all roles"
        >
          <Briefcase className="w-3 h-3" />
          <span className="truncate max-w-[160px]">{activeRole}</span>
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
                <CategoryBadge
                  category={activeCategory}
                  colorClass={catClass(activeCategory)}
                  size="sm"
                />
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
                <CategoryBadge
                  category={currentCard.category}
                  colorClass={catClass(currentCard.category)}
                  size="sm"
                />
              </button>
              <ChevronRight className="w-3 h-3 text-arch-text3/50" />
              <span className="font-semibold text-arch-text truncate max-w-[220px]">
                {currentCard.title}
              </span>
            </>
          )
        )}
      </nav>
      )}

      {!viewingRole ? (
        <RolePicker
          roles={roles}
          roleCounts={roleCounts}
          sharedCount={sharedCount}
          activeRole={activeRole}
          defaultRole={defaultRole}
          onSelect={enterRole}
          onAdd={(name) => {
            addRole(name); // creates + switches to the new role with starter cards
            setShowOverview(true);
            setIsEditing(false);
            setViewingRole(true);
          }}
          onRename={renameRole}
          onDelete={handleDeleteRole}
        />
      ) : showOverview ? (
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
            <Tooltip content="Show cards from every category." side="bottom">
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
            </Tooltip>
            {categories.map((cat) => (
              <Tooltip
                key={cat.name}
                content={categoryDescription(cat.name)}
                side="bottom"
              >
                <button
                  onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${
                    activeCategory === cat.name
                      ? "bg-arch-text/10 text-arch-text border-arch-text/25"
                      : "bg-transparent border-arch-border text-arch-text3 hover:text-arch-text hover:border-arch-text/25"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT_CLASSES[cat.color]}`} />
                  {cat.name}
                </button>
              </Tooltip>
            ))}
            <button
              onClick={() => setShowCategoryManager(true)}
              title="Manage categories"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-full border border-dashed border-arch-border text-arch-text3 hover:text-arch-blue hover:border-arch-blue/40 transition-colors"
            >
              <Settings2 size={12} /> Edit
            </button>
            <span className="text-[11px] text-arch-text3 ml-auto">
              {filteredCards.length} of {cards.length}
            </span>
          </div>
          {filteredCards.length > 0 ? (
            <CardOverview
              cards={filteredCards}
              currentIndex={filteredCurrentIndex}
              categoryClass={catClass}
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
                  key={currentCard.id}
                  card={currentCard}
                  roles={roles}
                  categories={categories}
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                  onDelete={() => setConfirmDelete(true)}
                />
              ) : (
                <CardView
                  card={currentCard}
                  cardIndex={currentIndex}
                  totalCards={cards.length}
                  roles={roles}
                  onEdit={() => setIsEditing(true)}
                  onClone={handleCloneCard}
                  onPresent={() => setPresenting(true)}
                  onMentalModel={() => setMentalModelCard(currentCard)}
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
            colorClass={catClass(currentCard.category)}
            onClose={() => setPresenting(false)}
            onPrev={goPrev}
            onNext={goNext}
            onMentalModel={() => setMentalModelCard(currentCard)}
          />,
          document.body
        )}

      {/* Mental Models overlay — static STAR mental-model deck */}
      {showMentalModels &&
        createPortal(
          <MentalModelOverlay onClose={() => setShowMentalModels(false)} />,
          document.body
        )}

      {/* Per-card mental model modal (view + edit) */}
      {mentalModelCard &&
        createPortal(
          <CardMentalModelModal
            card={mentalModelCard}
            onSave={(model) => {
              updateCard(mentalModelCard.id, { mentalModel: model });
              setMentalModelCard((prev) =>
                prev ? { ...prev, mentalModel: model } : prev
              );
            }}
            onDelete={() => {
              updateCard(mentalModelCard.id, { mentalModel: undefined });
              setMentalModelCard(null);
            }}
            onClose={() => setMentalModelCard(null)}
          />,
          document.body
        )}

      {/* Category manager modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onRename={handleRenameCategory}
          onDelete={handleDeleteCategory}
          onRecolor={setCategoryColor}
          onClose={() => setShowCategoryManager(false)}
        />
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
                      <CategoryBadge
                        category={template.category}
                        colorClass={catClass(template.category)}
                        size="sm"
                      />
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
