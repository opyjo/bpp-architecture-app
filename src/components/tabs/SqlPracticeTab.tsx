"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import {
  Play,
  RotateCcw,
  Loader2,
  Table2,
  AlertCircle,
  Terminal,
  Network,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  BookOpen,
  ListChecks,
  Zap,
  PenLine,
  Database,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  WandSparkles,
  Eraser,
  ListTree,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import CodeMirror, {
  EditorView,
  keymap,
  placeholder,
  type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { indentWithTab } from "@codemirror/commands";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { format as formatSql } from "sql-formatter";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  SEED_SQL,
  ER_DIAGRAM,
  MODELLING_CHALLENGES,
  type ModellingChallenge,
} from "@/data/sql-practice";
import {
  CHEAT_SECTIONS,
  CHEAT_LEVELS,
  GOTCHAS,
  DRILLS,
  MODELLING_VOCAB,
  WHITEBOARD_FRAMEWORK,
  RAPID_FIRE,
  FINAL_HABIT,
  type CheatSection,
  type Drill,
} from "@/data/sql-cheatsheet";

type Mode = "query" | "learn" | "drills" | "model";

const MODE_TABS: { key: Mode; label: string; Icon: typeof Terminal }[] = [
  { key: "query", label: "Query", Icon: Terminal },
  { key: "learn", label: "Cheat sheet", Icon: BookOpen },
  { key: "drills", label: "Drills", Icon: ListChecks },
  { key: "model", label: "Data modelling", Icon: Network },
];

interface ResultSet {
  fields: { name: string; dataTypeID: number }[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
}

const MAX_DISPLAY_ROWS = 500;

// ─── Schema explorer data (mirrors SEED_SQL) ────────────────────────────────

interface SchemaColumn {
  name: string;
  type: string;
  key?: "pk" | "fk";
}

const SCHEMA_TABLES: { name: string; hint: string; columns: SchemaColumn[] }[] = [
  {
    name: "members",
    hint: "Plan members",
    columns: [
      { name: "id", type: "serial", key: "pk" },
      { name: "name", type: "text" },
      { name: "status", type: "text" },
      { name: "employer", type: "text" },
      { name: "province", type: "text" },
      { name: "date_of_birth", type: "date" },
      { name: "enrolled_at", type: "date" },
      { name: "salary", type: "numeric" },
      { name: "email_verified", type: "bool" },
    ],
  },
  {
    name: "beneficiaries",
    hint: "Payout allocations",
    columns: [
      { name: "id", type: "serial", key: "pk" },
      { name: "member_id", type: "int", key: "fk" },
      { name: "name", type: "text" },
      { name: "relationship", type: "text" },
      { name: "allocation_pct", type: "numeric" },
      { name: "is_primary", type: "bool" },
      { name: "effective_at", type: "date" },
    ],
  },
  {
    name: "contributions",
    hint: "Payments into the plan",
    columns: [
      { name: "id", type: "serial", key: "pk" },
      { name: "member_id", type: "int", key: "fk" },
      { name: "amount", type: "numeric" },
      { name: "contributed_at", type: "date" },
    ],
  },
  {
    name: "projections",
    hint: "Pension projections",
    columns: [
      { name: "id", type: "serial", key: "pk" },
      { name: "member_id", type: "int", key: "fk" },
      { name: "projected_annual", type: "numeric" },
      { name: "as_of", type: "date" },
      { name: "assumptions", type: "text" },
    ],
  },
  {
    name: "audit_log",
    hint: "Change history",
    columns: [
      { name: "id", type: "serial", key: "pk" },
      { name: "member_id", type: "int", key: "fk" },
      { name: "entity", type: "text" },
      { name: "action", type: "text" },
      { name: "field", type: "text" },
      { name: "old_value", type: "text" },
      { name: "new_value", type: "text" },
      { name: "changed_by", type: "text" },
      { name: "changed_at", type: "timestamp" },
    ],
  },
];

const STARTER_QUERIES: { label: string; sql: string }[] = [
  {
    label: "Browse members",
    sql: "SELECT * FROM members LIMIT 10;",
  },
  {
    label: "Contributions per member",
    sql: `SELECT m.name, SUM(c.amount) AS total_contributed
FROM members m
JOIN contributions c ON c.member_id = m.id
GROUP BY m.name
ORDER BY total_contributed DESC;`,
  },
  {
    label: "Find broken allocations",
    sql: `-- Beneficiary allocations should total exactly 100%
SELECT member_id, SUM(allocation_pct) AS total_pct
FROM beneficiaries
GROUP BY member_id
HAVING SUM(allocation_pct) <> 100;`,
  },
];

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ─── Drill answer checking ──────────────────────────────────────────────────

type DrillVerdict = "match" | "ordering" | "mismatch" | "empty" | "error";

interface DrillCheckResult {
  status: DrillVerdict;
  message?: string;
  userRows?: number;
  refRows?: number;
  userCols?: number;
  refCols?: number;
}

// Turn a result set into per-row value signatures (column NAMES ignored, so a
// different alias still counts as correct; column ORDER and values matter).
function rowSignatures(rs: ResultSet | null): string[] {
  if (!rs) return [];
  return rs.rows.map((row) =>
    rs.fields.map((f) => formatCell(row[f.name])).join("")
  );
}

// Compare the learner's result against the reference solution's result.
//  match     → same rows in the same order
//  ordering  → same rows as a set, but a different order
//  mismatch  → different column count, row count, or values
function compareResults(
  user: ResultSet | null,
  ref: ResultSet | null
): DrillVerdict {
  if (!user || !ref) return "mismatch";
  if (user.fields.length !== ref.fields.length) return "mismatch";

  const u = rowSignatures(user);
  const r = rowSignatures(ref);
  if (u.length !== r.length) return "mismatch";

  if (u.every((v, i) => v === r[i])) return "match";

  const us = [...u].sort();
  const rs = [...r].sort();
  return us.every((v, i) => v === rs[i]) ? "ordering" : "mismatch";
}

// ─── EXPLAIN plan colouring ─────────────────────────────────────────────────

// Highlight the interview-relevant bits of an EXPLAIN line: scan strategy
// (seq scans in amber as a talking point, index scans in green), and the
// planner's cost/row estimates.
function highlightPlanLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re =
    /(Seq Scan|Index Only Scan|Index Scan|Bitmap Heap Scan|Bitmap Index Scan|Hash Join|Merge Join|Nested Loop|Hash|Sort|Aggregate|HashAggregate|GroupAggregate|Materialize|Limit|Gather|Append)|(\(cost=[^)]*\))|(rows=\d+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const [tok, node, cost, rows] = m;
    let cls = "text-[#61afef]";
    if (node) {
      cls = /Seq Scan/.test(node)
        ? "text-[#e5c07b]" // seq scan — worth calling out
        : /Index/.test(node)
        ? "text-[#98c379]" // index scan — the good path
        : "text-[#c678dd]"; // joins/sorts/aggregates
    } else if (cost) cls = "text-[#7f848e]";
    else if (rows) cls = "text-[#56b6c2]";
    parts.push(
      <span key={key++} className={cls}>
        {tok}
      </span>
    );
    last = m.index + tok.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

// ─── Editor (CodeMirror: highlighting + schema-aware autocomplete) ──────────

// Table → columns map so autocomplete suggests real schema objects.
const CM_SCHEMA = Object.fromEntries(
  SCHEMA_TABLES.map((t) => [t.name, t.columns.map((c) => c.name)])
);

const CM_FONT_THEME = EditorView.theme({
  "&": { fontSize: "13px", height: "100%" },
  ".cm-scroller": {
    fontFamily:
      '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    lineHeight: "1.65",
    padding: "6px 0",
  },
  ".cm-gutters": { paddingLeft: "4px" },
  "&.cm-focused": { outline: "none" },
});

const CM_EXTENSIONS = [
  sql({ dialect: PostgreSQL, schema: CM_SCHEMA, upperCaseKeywords: true }),
  keymap.of([indentWithTab]),
  placeholder("-- Write SQL here — autocomplete as you type, ⌘⏎ to run"),
  CM_FONT_THEME,
];

function SqlEditor({
  value,
  onChange,
  onRun,
  editorRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  editorRef: React.Ref<ReactCodeMirrorRef>;
}) {
  // Intercept ⌘⏎/Ctrl+Enter before CodeMirror's own keymap sees it.
  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onRun();
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden" onKeyDownCapture={onKeyDownCapture}>
      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={onChange}
        extensions={CM_EXTENSIONS}
        theme={oneDark}
        height="100%"
        basicSetup={{ foldGutter: false, searchKeymap: false }}
        className="h-full"
      />
    </div>
  );
}

// ─── Schema sidebar ──────────────────────────────────────────────────────────

function SchemaSidebar({ onQuickQuery }: { onQuickQuery: (sql: string) => void }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(["members"]));

  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <aside className="w-60 shrink-0 border-l border-arch-border bg-arch-bg2 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-1.5 px-3 h-9 border-b border-arch-border bg-arch-bg2">
        <Database className="w-3.5 h-3.5 text-arch-teal" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-arch-text2">
          Schema
        </span>
        <span className="ml-auto text-[10px] font-mono text-arch-text3">
          {SCHEMA_TABLES.length} tables
        </span>
      </div>

      <div className="p-1.5">
        {SCHEMA_TABLES.map((t) => {
          const isOpen = open.has(t.name);
          return (
            <div key={t.name} className="rounded-md">
              <div className="group flex items-center gap-1.5 w-full px-1.5 py-1.5 rounded-md hover:bg-arch-bg3 transition-colors">
                <button
                  onClick={() => toggle(t.name)}
                  className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                >
                  <ChevronRight
                    className={`w-3 h-3 shrink-0 text-arch-text3 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                  <Table2 className="w-3.5 h-3.5 shrink-0 text-arch-blue" />
                  <span className="text-[12px] font-mono font-medium text-arch-text truncate">
                    {t.name}
                  </span>
                </button>
                <button
                  onClick={() => onQuickQuery(`SELECT * FROM ${t.name} LIMIT 10;`)}
                  title={`SELECT * FROM ${t.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-arch-purple hover:bg-arch-purple/10 transition-all"
                >
                  <Play className="w-3 h-3" />
                </button>
              </div>

              {isOpen && (
                <div className="ml-[22px] mb-1 border-l border-arch-border pl-2.5 py-0.5 space-y-px">
                  {t.columns.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5 py-[3px]">
                      <span className="text-[11.5px] font-mono text-arch-text2 truncate">
                        {c.name}
                      </span>
                      {c.key && (
                        <span
                          className={`shrink-0 text-[8.5px] font-mono font-bold px-1 rounded ${
                            c.key === "pk"
                              ? "bg-arch-amber/15 text-arch-amber"
                              : "bg-arch-blue/15 text-arch-blue"
                          }`}
                        >
                          {c.key.toUpperCase()}
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-[10px] font-mono text-arch-text3">
                        {c.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="px-3 pb-3 text-[10.5px] leading-relaxed text-arch-text3">
        The seeded sandbox — Reset restores it. The full ER diagram lives in{" "}
        <span className="text-arch-text2">Data modelling</span>.
      </p>
    </aside>
  );
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export default function SqlPracticeTab() {
  const dbRef = useRef<PGlite | null>(null);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("query");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResultSet | null>(null);
  const [plan, setPlan] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorHeight, setEditorHeight] = useState(248);
  // Remembers the pre-format text so Format can toggle back to it.
  const [formatMemo, setFormatMemo] = useState<{
    raw: string;
    pretty: string;
  } | null>(null);

  // Replace the whole document through the editor view as well as React
  // state: react-codemirror's value-prop sync defers external updates while
  // its typing latch is active, which can silently drop them. The view is
  // absent when Query mode is unmounted — then the value prop covers it.
  const setEditorText = useCallback((text: string) => {
    setQuery(text);
    const view = cmRef.current?.view;
    if (view && view.state.doc.toString() !== text) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
    }
  }, []);

  // Load a challenge's reference SQL into the editor and jump to Query mode.
  const loadIntoEditor = useCallback(
    (sql: string) => {
      setEditorText(sql);
      setError(null);
      setResult(null);
      setPlan(null);
      setMode("query");
    },
    [setEditorText]
  );

  // Initialise a fresh in-memory Postgres and load the seed once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Import the copy served from /public at runtime instead of the npm
        // package: Turbopack's production build breaks PGlite's Emscripten
        // loader ("instantiateWasm is not a function") when it bundles it.
        // Files land in public/pglite/ via scripts/copy-pglite.mjs.
        const pgliteUrl = "/pglite/index.js";
        const { PGlite }: typeof import("@electric-sql/pglite") =
          await import(/* webpackIgnore: true */ pgliteUrl);
        const db = new PGlite(); // in-memory: fresh sandbox per mount
        await db.exec(SEED_SQL);
        if (cancelled) {
          await db.close();
          return;
        }
        dbRef.current = db;
        setDbReady(true);
      } catch (e) {
        if (!cancelled) setInitError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      dbRef.current?.close();
      dbRef.current = null;
    };
  }, []);

  const execSql = useCallback(
    async (raw: string) => {
      const db = dbRef.current;
      if (!db || running) return;
      const sql = raw.trim();
      if (!sql) return;

      setRunning(true);
      setError(null);
      setPlan(null);
      const started = performance.now();
      try {
        const results = await db.exec(sql);
        // Show the last statement that produced columns; else the last one
        // (e.g. an UPDATE) so we can report affected rows.
        const withFields = results.filter((r) => r.fields.length > 0);
        const chosen = withFields.at(-1) ?? results.at(-1) ?? null;
        setResult(
          chosen
            ? {
                fields: chosen.fields,
                rows: chosen.rows as Record<string, unknown>[],
                affectedRows: chosen.affectedRows,
              }
            : null
        );
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setElapsedMs(Math.round(performance.now() - started));
        setRunning(false);
      }
    },
    [running]
  );

  const runQuery = useCallback(() => execSql(query), [execSql, query]);

  // Run EXPLAIN (planner estimate only — the query is NOT executed) and show
  // the plan in place of the results table.
  const explainQuery = useCallback(async () => {
    const db = dbRef.current;
    if (!db || running) return;
    const sql = query.trim();
    if (!sql) return;

    setRunning(true);
    setError(null);
    setResult(null);
    const started = performance.now();
    try {
      const results = await db.exec(`EXPLAIN ${sql}`);
      const chosen = results.filter((r) => r.fields.length > 0).at(-1) ?? null;
      const lines = chosen
        ? (chosen.rows as Record<string, unknown>[]).map((r) =>
            String(r["QUERY PLAN"])
          )
        : [];
      setPlan(lines);
    } catch (e) {
      setPlan(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setElapsedMs(Math.round(performance.now() - started));
      setRunning(false);
    }
  }, [running, query]);

  // Run SQL purely to obtain its result set, without disturbing the main
  // results pane — backs the drill answer check.
  const execForResult = useCallback(
    async (sql: string): Promise<ResultSet | null> => {
      const db = dbRef.current;
      if (!db) throw new Error("Database not ready");
      const results = await db.exec(sql);
      const withFields = results.filter((r) => r.fields.length > 0);
      const chosen = withFields.at(-1) ?? results.at(-1) ?? null;
      return chosen
        ? {
            fields: chosen.fields,
            rows: chosen.rows as Record<string, unknown>[],
            affectedRows: chosen.affectedRows,
          }
        : null;
    },
    []
  );

  // Compare the query currently in the editor against a drill's reference
  // solution by running both and diffing their result sets.
  const checkAnswer = useCallback(
    async (solution: string): Promise<DrillCheckResult> => {
      const userSql = query.trim();
      if (!userSql) return { status: "empty" };
      if (!dbRef.current)
        return {
          status: "error",
          message: "Database is still booting — try again in a moment.",
        };
      try {
        const userRes = await execForResult(userSql);
        const refRes = await execForResult(solution);
        return {
          status: compareResults(userRes, refRes),
          userRows: userRes?.rows.length ?? 0,
          refRows: refRes?.rows.length ?? 0,
          userCols: userRes?.fields.length ?? 0,
          refCols: refRes?.fields.length ?? 0,
        };
      } catch (e) {
        return {
          status: "error",
          message: e instanceof Error ? e.message : String(e),
        };
      }
    },
    [query, execForResult]
  );

  const runStarter = useCallback(
    (sql: string) => {
      setEditorText(sql);
      execSql(sql);
    },
    [setEditorText, execSql]
  );

  // Clears the editor text only — results stay until the next run.
  const clearEditor = useCallback(() => {
    setEditorText("");
    cmRef.current?.view?.focus();
  }, [setEditorText]);

  // Format toggles: the first click pretty-prints and remembers the original;
  // a second click (while the text is still what we produced) reverts to it.
  const formatQuery = useCallback(() => {
    const current = cmRef.current?.view?.state.doc.toString() ?? query;

    if (formatMemo && current === formatMemo.pretty) {
      setEditorText(formatMemo.raw);
      return;
    }

    try {
      const pretty = formatSql(current, {
        language: "postgresql",
        keywordCase: "upper",
        tabWidth: 2,
      });
      if (pretty !== current) {
        setFormatMemo({ raw: current, pretty });
        setEditorText(pretty);
      }
    } catch {
      // Unparsable SQL mid-edit — leave the text untouched.
    }
  }, [setEditorText, query, formatMemo]);

  const resetDatabase = useCallback(async () => {
    const db = dbRef.current;
    if (!db || resetting) return;
    setResetting(true);
    setError(null);
    try {
      await db.exec(SEED_SQL);
      setResult(null);
      setPlan(null);
      setElapsedMs(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  }, [resetting]);

  // Drag the divider between editor and results to resize the editor pane.
  const onDividerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = editorHeight;
    const move = (ev: PointerEvent) =>
      setEditorHeight(Math.min(520, Math.max(120, startH + ev.clientY - startY)));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // True when the editor still holds exactly what Format produced, so the next
  // click should undo rather than reformat.
  const canUndoFormat = !!formatMemo && query === formatMemo.pretty;

  // ── Init / error gates ────────────────────────────────────────────────────
  if (initError) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md rounded-xl border border-arch-red/40 bg-arch-red/5 p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-arch-red" />
          <p className="text-sm font-medium text-arch-text mb-1">
            Couldn&apos;t start the database
          </p>
          <p className="text-xs text-arch-text2 font-mono break-words">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar: mode switcher + db status ───────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-arch-border bg-arch-bg2 shrink-0">
        <div className="flex items-center gap-0.5 rounded-lg border border-arch-border bg-arch-bg3 p-0.5">
          {MODE_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
                mode === key
                  ? "bg-arch-bg2 text-arch-text shadow-sm"
                  : "text-arch-text2 hover:text-arch-text"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          {!dbReady ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-arch-bg3 text-[11px] font-mono text-arch-text3">
              <Loader2 className="w-3 h-3 animate-spin" /> booting postgres…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-arch-green/10 text-[11px] font-mono text-arch-green">
              <span className="w-1.5 h-1.5 rounded-full bg-arch-green animate-pulse" />
              postgres ready
            </span>
          )}
        </div>
      </div>

      {mode === "query" ? (
        <div className="flex-1 min-h-0 flex">
          <main className="flex-1 min-w-0 flex flex-col">
            {/* ── Editor pane ─────────────────────────────────────────────── */}
            <div
              className="flex flex-col shrink-0 bg-[#282c34]"
              style={{ height: editorHeight }}
            >
              <div className="flex items-center gap-2 px-3 h-10 shrink-0 border-b border-white/[0.06] bg-[#21252b]">
                <Terminal className="w-3.5 h-3.5 text-[#5c6370]" />
                <span className="text-[11px] font-mono text-[#9aa0b4]">query.sql</span>

                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={clearEditor}
                    disabled={!query}
                    title="Clear the editor"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium text-[#9aa0b4] hover:text-white hover:bg-white/[0.07] disabled:opacity-40 transition-colors"
                  >
                    <Eraser className="w-3 h-3" />
                    Clear
                  </button>
                  <button
                    onClick={formatQuery}
                    disabled={!query.trim()}
                    title={
                      canUndoFormat
                        ? "Revert to the pre-format text"
                        : "Pretty-print the SQL"
                    }
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium text-[#9aa0b4] hover:text-white hover:bg-white/[0.07] disabled:opacity-40 transition-colors"
                  >
                    <WandSparkles className="w-3 h-3" />
                    {canUndoFormat ? "Unformat" : "Format"}
                  </button>
                  <button
                    onClick={resetDatabase}
                    disabled={!dbReady || resetting}
                    title="Drop and reseed the database"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium text-[#9aa0b4] hover:text-white hover:bg-white/[0.07] disabled:opacity-40 transition-colors"
                  >
                    <RotateCcw
                      className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`}
                    />
                    Reset
                  </button>
                  <button
                    onClick={explainQuery}
                    disabled={!dbReady || running || !query.trim()}
                    title="Show the query plan without running the query"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium text-[#9aa0b4] hover:text-white hover:bg-white/[0.07] disabled:opacity-40 transition-colors"
                  >
                    <ListTree className="w-3 h-3" />
                    Explain
                  </button>
                  <button
                    onClick={runQuery}
                    disabled={!dbReady || running}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-arch-purple text-white text-[12px] font-semibold shadow-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {running ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    Run
                    <kbd className="text-[9px] font-mono px-1 py-px rounded bg-white/20">
                      ⌘⏎
                    </kbd>
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <button
                    onClick={() => setSidebarOpen((v) => !v)}
                    title={sidebarOpen ? "Hide schema" : "Show schema"}
                    className="p-1.5 rounded-md text-[#9aa0b4] hover:text-white hover:bg-white/[0.07] transition-colors"
                  >
                    {sidebarOpen ? (
                      <PanelRightClose className="w-3.5 h-3.5" />
                    ) : (
                      <PanelRightOpen className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <SqlEditor
                value={query}
                onChange={setQuery}
                onRun={runQuery}
                editorRef={cmRef}
              />
            </div>

            {/* ── Divider (drag to resize) ────────────────────────────────── */}
            <div
              onPointerDown={onDividerDown}
              className="h-1.5 -my-[3px] z-10 shrink-0 cursor-row-resize group flex items-center justify-center"
            >
              <div className="h-[3px] w-full group-hover:bg-arch-purple/40 transition-colors" />
            </div>

            {/* ── Results pane ────────────────────────────────────────────── */}
            <div className="flex-1 min-h-0 flex flex-col bg-arch-bg">
              <div className="flex items-center gap-2 px-4 h-9 shrink-0 border-b border-arch-border bg-arch-bg2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-arch-text2">
                  {plan ? "Query plan" : "Results"}
                </span>
                {plan && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-mono px-1.5 py-px rounded bg-arch-teal/10 text-arch-teal">
                    <ListTree className="w-3 h-3" /> estimate · not executed
                  </span>
                )}
                {result && result.fields.length > 0 && (
                  <span className="text-[11px] font-mono px-1.5 py-px rounded bg-arch-bg3 text-arch-text2">
                    {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
                  </span>
                )}
                {result && result.rows.length > MAX_DISPLAY_ROWS && (
                  <span className="text-[10.5px] font-mono text-arch-amber">
                    showing first {MAX_DISPLAY_ROWS}
                  </span>
                )}
                {elapsedMs !== null && (
                  <span className="ml-auto text-[11px] font-mono text-arch-text3">
                    {elapsedMs} ms
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                {error ? (
                  <div className="m-4 rounded-lg border border-arch-red/40 bg-arch-red/5 p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-arch-red" />
                      <span className="text-[12px] font-semibold text-arch-red">
                        Query error
                      </span>
                    </div>
                    <pre className="text-[12px] font-mono text-arch-text2 whitespace-pre-wrap break-words">
                      {error}
                    </pre>
                  </div>
                ) : plan ? (
                  <QueryPlanView lines={plan} />
                ) : result ? (
                  <ResultsTable result={result} />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                      <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-arch-purple/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-arch-purple" />
                      </div>
                      <p className="text-[13.5px] font-semibold text-arch-text mb-1">
                        Run your first query
                      </p>
                      <p className="text-[12px] text-arch-text2 leading-relaxed mb-4">
                        A real Postgres runs in your browser, seeded with pension-plan
                        data. New to SQL? The Cheat sheet tab teaches it from zero.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {STARTER_QUERIES.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => runStarter(s.sql)}
                            disabled={!dbReady}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-arch-border bg-arch-bg2 text-[11.5px] font-medium text-arch-text2 hover:text-arch-purple hover:border-arch-purple/40 disabled:opacity-40 transition-colors"
                          >
                            <Play className="w-2.5 h-2.5" />
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          {sidebarOpen && <SchemaSidebar onQuickQuery={runStarter} />}
        </div>
      ) : mode === "learn" ? (
        <CheatSheetView onLoad={loadIntoEditor} />
      ) : mode === "drills" ? (
        <DrillsView onLoad={loadIntoEditor} onCheck={checkAnswer} />
      ) : (
        <ModellingView onLoad={loadIntoEditor} />
      )}
    </div>
  );
}

// ─── Cheat sheet ─────────────────────────────────────────────────────────────

function CheatSheetView({ onLoad }: { onLoad: (sql: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-arch-bg">
      <div className="max-w-4xl mx-auto p-5 space-y-6">
        <p className="text-[12.5px] text-arch-text2 leading-relaxed">
          A complete course from your very first{" "}
          <span className="font-mono text-arch-purple">SELECT</span> to window functions —
          no prior SQL assumed. Every snippet runs against the seeded dataset: hit{" "}
          <span className="font-medium text-arch-text">Load into editor</span>, run it,
          and do the <span className="font-medium text-arch-text">your turn</span>{" "}
          exercise before moving on. Finish a level, then come back for the next; the
          Drills tab is your exam.
        </p>

        {CHEAT_LEVELS.map((lvl) => (
          <div key={lvl.key} className="space-y-4">
            <div className="pt-2 border-t-2 border-arch-purple/40">
              <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-arch-purple">
                {lvl.title}
              </h3>
              <p className="text-[12px] text-arch-text2 mt-0.5">{lvl.sub}</p>
            </div>
            {CHEAT_SECTIONS.filter((s) => s.level === lvl.key).map((s) => (
              <CheatSectionCard
                key={s.title}
                section={s}
                index={CHEAT_SECTIONS.indexOf(s) + 1}
                onLoad={onLoad}
              />
            ))}
          </div>
        ))}

        {/* Gotchas */}
        <section>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-arch-text mb-1">
            <AlertCircle className="w-4 h-4 text-arch-amber" /> Gotchas that cost interviews
          </h3>
          <div className="rounded-lg border border-arch-border overflow-x-auto bg-arch-bg2">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-arch-border">
                  <th className="text-left px-3 py-2 font-semibold text-arch-text bg-arch-bg3 whitespace-nowrap">Trap</th>
                  <th className="text-left px-3 py-2 font-semibold text-arch-text bg-arch-bg3">What actually happens</th>
                  <th className="text-left px-3 py-2 font-semibold text-arch-text bg-arch-bg3">Defense</th>
                </tr>
              </thead>
              <tbody>
                {GOTCHAS.map((g) => (
                  <tr key={g.trap} className="border-b border-arch-border/60 last:border-0">
                    <td className="px-3 py-2 font-mono text-arch-purple whitespace-nowrap">{g.trap}</td>
                    <td className="px-3 py-2 text-arch-text2">{g.happens}</td>
                    <td className="px-3 py-2 text-arch-text2">{g.defense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rapid-fire Q&A */}
        <section>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-arch-text mb-1">
            <Zap className="w-4 h-4 text-arch-teal" /> Rapid-fire: classic questions, thirty-second answers
          </h3>
          <div className="space-y-2">
            {RAPID_FIRE.map((rf) => (
              <div key={rf.q} className="rounded-lg border border-arch-border bg-arch-bg2 px-4 py-2.5">
                <p className="text-[13px] font-semibold text-arch-text">{rf.q}</p>
                <p className="text-[12.5px] text-arch-text2 mt-0.5 leading-relaxed">{rf.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-arch-green/30 bg-arch-green/5 px-3 py-2.5">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-green" />
            <p className="text-[12px] text-arch-text2 leading-relaxed">
              <span className="font-semibold text-arch-text">Final habit to rehearse: </span>
              {FINAL_HABIT}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function CheatSectionCard({
  section,
  index,
  onLoad,
}: {
  section: CheatSection;
  index: number;
  onLoad: (sql: string) => void;
}) {
  return (
    <section className="rounded-lg border border-arch-border bg-arch-bg2 px-4 py-3.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-mono text-arch-text3">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-[14px] font-semibold text-arch-text">{section.title}</h3>
      </div>
      <p className="text-[12.5px] text-arch-text2 mt-1 leading-relaxed">{section.blurb}</p>

      <div className="mt-2 space-y-2">
        {section.snippets.map((snip, i) => (
          <div key={i}>
            <CodeBlock language="sql">{snip.sql}</CodeBlock>
            <button
              onClick={() => onLoad(snip.sql)}
              className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-arch-purple hover:opacity-80"
            >
              <Play className="w-3 h-3" /> Load into editor
            </button>
          </div>
        ))}
      </div>

      {section.tip && (
        <div className="mt-2.5 flex items-start gap-2 rounded-md border border-arch-green/30 bg-arch-green/5 px-3 py-2">
          <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-green" />
          <p className="text-[12px] text-arch-text2 leading-relaxed">
            <span className="font-semibold text-arch-text">Say this: </span>
            {section.tip}
          </p>
        </div>
      )}
      {section.trap && (
        <div className="mt-2.5 flex items-start gap-2 rounded-md border border-arch-amber/30 bg-arch-amber/5 px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-amber" />
          <p className="text-[12px] text-arch-text2 leading-relaxed">
            <span className="font-semibold text-arch-text">Interview trap: </span>
            {section.trap}
          </p>
        </div>
      )}
      {section.tryIt && (
        <div className="mt-2.5 flex items-start gap-2 rounded-md border border-arch-blue/30 bg-arch-blue/5 px-3 py-2">
          <PenLine className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-blue" />
          <p className="text-[12px] text-arch-text2 leading-relaxed">
            <span className="font-semibold text-arch-text">Your turn: </span>
            {section.tryIt}
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Drills ──────────────────────────────────────────────────────────────────

function DrillsView({
  onLoad,
  onCheck,
}: {
  onLoad: (sql: string) => void;
  onCheck: (solution: string) => Promise<DrillCheckResult>;
}) {
  return (
    <div className="flex-1 overflow-auto bg-arch-bg">
      <div className="max-w-4xl mx-auto p-5 space-y-3">
        <p className="text-[12.5px] text-arch-text2 leading-relaxed">
          Ten drills, easiest to hardest. Write your answer in the Query tab, then come
          back and hit{" "}
          <span className="font-medium text-arch-text">Check my answer</span> — it runs
          your query and the reference against the sandbox and compares the results, so a
          different query that returns the same rows still counts. Stuck? Reveal the
          solution. The drills hunt the data problems planted in the seed.
        </p>
        {DRILLS.map((d, i) => (
          <DrillCard
            key={d.skill}
            drill={d}
            index={i + 1}
            onLoad={onLoad}
            onCheck={onCheck}
          />
        ))}
      </div>
    </div>
  );
}

function DrillVerdictBanner({ check }: { check: DrillCheckResult }) {
  const map = {
    match: {
      Icon: CheckCircle2,
      cls: "border-arch-green/40 bg-arch-green/5 text-arch-green",
      title: "Correct",
      body: `Your result matches the reference — ${check.refRows} row${
        check.refRows === 1 ? "" : "s"
      }, same order.`,
    },
    ordering: {
      Icon: ArrowUpDown,
      cls: "border-arch-amber/40 bg-arch-amber/5 text-arch-amber",
      title: "Right rows, different order",
      body: "You returned exactly the right rows, but in a different order. If the task specified an ordering, add or adjust ORDER BY.",
    },
    mismatch: {
      Icon: XCircle,
      cls: "border-arch-red/40 bg-arch-red/5 text-arch-red",
      title: "Not a match yet",
      body: `Your query returned ${check.userRows} row${
        check.userRows === 1 ? "" : "s"
      } / ${check.userCols} column${
        check.userCols === 1 ? "" : "s"
      }; the reference has ${check.refRows} row${
        check.refRows === 1 ? "" : "s"
      } / ${check.refCols} column${
        check.refCols === 1 ? "" : "s"
      }. Compare, tweak, and check again.`,
    },
    empty: {
      Icon: PenLine,
      cls: "border-arch-border bg-arch-bg3/50 text-arch-text2",
      title: "Nothing to check",
      body: "Write your answer in the Query tab first, then come back and check it here.",
    },
    error: {
      Icon: AlertCircle,
      cls: "border-arch-red/40 bg-arch-red/5 text-arch-red",
      title: "Your query errored",
      body: check.message ?? "The query couldn't run.",
    },
  }[check.status];

  const { Icon } = map;
  return (
    <div className={`mt-2.5 flex items-start gap-2 rounded-md border px-3 py-2 ${map.cls}`}>
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <p className="text-[12px] leading-relaxed">
        <span className="font-semibold">{map.title}. </span>
        <span className="text-arch-text2">{map.body}</span>
      </p>
    </div>
  );
}

function DrillCard({
  drill,
  index,
  onLoad,
  onCheck,
}: {
  drill: Drill;
  index: number;
  onLoad: (sql: string) => void;
  onCheck: (solution: string) => Promise<DrillCheckResult>;
}) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<DrillCheckResult | null>(null);

  const runCheck = async () => {
    setChecking(true);
    try {
      setCheck(await onCheck(drill.solution));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="rounded-lg border border-arch-border bg-arch-bg2 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-arch-text3">
            Drill {String(index).padStart(2, "0")}
          </span>
          <span className="shrink-0 text-[10px] font-mono text-arch-blue/80">
            {drill.skill}
          </span>
        </div>
        <p className="text-[13px] font-medium text-arch-text mt-1 leading-relaxed">
          {drill.task}
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={runCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-arch-green/10 text-arch-green text-[12px] font-medium hover:bg-arch-green/15 disabled:opacity-50 transition-colors"
          >
            {checking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Check my answer
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-[12px] font-medium text-arch-purple hover:opacity-80"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
            {open ? "Hide solution" : "Reveal solution"}
          </button>
        </div>

        {check && <DrillVerdictBanner check={check} />}
      </div>

      {open && (
        <div className="border-t border-arch-border px-4 py-3 bg-arch-bg3/40">
          <CodeBlock language="sql">{drill.solution}</CodeBlock>
          {drill.note && (
            <div className="mt-2.5 flex items-start gap-2 rounded-md border border-arch-amber/30 bg-arch-amber/5 px-3 py-2">
              <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-amber" />
              <p className="text-[12px] text-arch-text2 leading-relaxed">{drill.note}</p>
            </div>
          )}
          <button
            onClick={() => onLoad(drill.solution)}
            className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-arch-purple text-white text-[12.5px] font-medium hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" /> Load into editor
          </button>
        </div>
      )}
    </div>
  );
}

function ModellingView({ onLoad }: { onLoad: (sql: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-arch-bg">
      <div className="max-w-4xl mx-auto p-5 space-y-6">
        {/* ER diagram */}
        <section>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-arch-text mb-1">
            <Network className="w-4 h-4 text-arch-teal" /> Entity-relationship diagram
          </h3>
          <p className="text-[12px] text-arch-text2 mb-3">
            The seed schema, drawn out. Note the 1-to-many fan-out from{" "}
            <code className="font-mono text-arch-purple">members</code> and where the
            foreign keys live.
          </p>
          <div className="rounded-lg border border-arch-border bg-arch-bg2 p-2">
            <MermaidDiagram chart={ER_DIAGRAM} />
          </div>
        </section>

        {/* Vocabulary */}
        <section>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-arch-text mb-1">
            <BookOpen className="w-4 h-4 text-arch-purple" /> Data modelling in sixty seconds
          </h3>
          <p className="text-[12px] text-arch-text2 mb-3">
            The vocabulary the interviewer is listening for — each row is the
            thirty-second answer, ready to say out loud.
          </p>
          <div className="rounded-lg border border-arch-border overflow-x-auto bg-arch-bg2">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-arch-border">
                  <th className="text-left px-3 py-2 font-semibold text-arch-text bg-arch-bg3 whitespace-nowrap">Term</th>
                  <th className="text-left px-3 py-2 font-semibold text-arch-text bg-arch-bg3">What to say</th>
                </tr>
              </thead>
              <tbody>
                {MODELLING_VOCAB.map((v) => (
                  <tr key={v.term} className="border-b border-arch-border/60 last:border-0">
                    <td className="px-3 py-2 font-medium text-arch-teal whitespace-nowrap">{v.term}</td>
                    <td className="px-3 py-2 text-arch-text2 leading-relaxed">{v.say}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Whiteboard framework */}
        <section>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-arch-text mb-1">
            <ListChecks className="w-4 h-4 text-arch-green" /> The whiteboard framework
          </h3>
          <p className="text-[12px] text-arch-text2 mb-3">
            When handed a requirements blurb, walk it in this order — narrating each
            step is precisely the BSA skill being assessed.
          </p>
          <ol className="space-y-2">
            {WHITEBOARD_FRAMEWORK.map((f, i) => (
              <li
                key={f.step}
                className="flex items-start gap-3 rounded-lg border border-arch-border bg-arch-bg2 px-4 py-2.5"
              >
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-arch-green/10 text-arch-green text-[11px] font-mono font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-arch-text">{f.step}</p>
                  <p className="text-[12px] text-arch-text2 leading-relaxed">{f.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Challenges */}
        <section>
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-arch-text mb-1">
            <Lightbulb className="w-4 h-4 text-arch-amber" /> Modelling challenges
          </h3>
          <p className="text-[12px] text-arch-text2 mb-3">
            Design the model, then reveal a reference solution — each one runs
            against the sandbox. Reset restores the base schema.
          </p>
          <div className="space-y-3">
            {MODELLING_CHALLENGES.map((c) => (
              <ChallengeCard key={c.title} challenge={c} onLoad={onLoad} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  onLoad,
}: {
  challenge: ModellingChallenge;
  onLoad: (sql: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-arch-border bg-arch-bg2 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-[13.5px] font-semibold text-arch-text">{challenge.title}</h4>
          <span className="shrink-0 text-[10px] font-mono text-arch-blue/80">
            {challenge.concept}
          </span>
        </div>
        <p className="text-[12.5px] text-arch-text2 mt-1.5 leading-relaxed">
          {challenge.prompt}
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-arch-purple hover:opacity-80"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
          {open ? "Hide" : "Reveal reference solution"}
        </button>
      </div>

      {open && (
        <div className="border-t border-arch-border px-4 py-3 bg-arch-bg3/40">
          <CodeBlock language="sql">{challenge.solution}</CodeBlock>
          <div className="mt-2.5 flex items-start gap-2 rounded-md border border-arch-amber/30 bg-arch-amber/5 px-3 py-2">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-amber" />
            <p className="text-[12px] text-arch-text2 leading-relaxed">
              <span className="font-semibold text-arch-text">In the interview: </span>
              {challenge.interviewNote}
            </p>
          </div>
          <button
            onClick={() => onLoad(challenge.solution)}
            className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-arch-purple text-white text-[12.5px] font-medium hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5" /> Load into editor
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Query plan (EXPLAIN) ────────────────────────────────────────────────────

function QueryPlanView({ lines }: { lines: string[] }) {
  return (
    <div className="p-4">
      <div className="rounded-lg border border-arch-border overflow-hidden bg-[#282c34]">
        <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/[0.06]">
          <ListTree className="w-3.5 h-3.5 text-arch-teal" />
          <span className="text-[11px] font-mono text-[#9aa0b4]">
            EXPLAIN — the planner&apos;s estimate
          </span>
        </div>
        <pre className="px-4 py-3 overflow-x-auto text-[12px] leading-[1.75] font-mono text-[#abb2bf] [font-variant-ligatures:none]">
          {lines.map((line, i) => (
            <div key={i}>{highlightPlanLine(line)}</div>
          ))}
        </pre>
      </div>
      <div className="mt-2 flex items-start gap-2 rounded-md border border-arch-blue/30 bg-arch-blue/5 px-3 py-2">
        <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-arch-blue" />
        <p className="text-[12px] text-arch-text2 leading-relaxed">
          <span className="font-semibold text-arch-text">Reading it: </span>
          each line is a step, indented children feed their parent. The{" "}
          <span className="font-mono text-arch-text">cost=</span> and{" "}
          <span className="font-mono text-arch-text">rows=</span> figures are the
          planner&apos;s estimates. A{" "}
          <span className="text-[#e5c07b] font-mono">Seq Scan</span> reads the whole
          table — fine here since the seed is tiny, but on a large table it&apos;s the
          cue to reach for an index and get an{" "}
          <span className="text-[#98c379] font-mono">Index Scan</span> instead.
        </p>
      </div>
    </div>
  );
}

// ─── Results table ───────────────────────────────────────────────────────────

function ResultsTable({ result }: { result: ResultSet }) {
  const { fields, rows } = result;

  // Statement returned no result set (DDL, or DML without RETURNING).
  if (fields.length === 0) {
    return (
      <div className="m-4 rounded-lg border border-arch-green/30 bg-arch-green/5 px-4 py-3 text-[13px] text-arch-text2">
        Statement executed successfully
        {typeof result.affectedRows === "number" && (
          <span className="font-mono text-arch-text">
            {" "}· {result.affectedRows} row{result.affectedRows === 1 ? "" : "s"} affected
          </span>
        )}
      </div>
    );
  }

  const shown = rows.slice(0, MAX_DISPLAY_ROWS);

  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr>
          {fields.map((f) => (
            <th
              key={f.name}
              className="sticky top-0 z-10 text-left px-3.5 py-2 font-mono font-semibold text-[11.5px] text-arch-text2 whitespace-nowrap bg-arch-bg2 border-b border-arch-border shadow-[0_1px_0_var(--arch-border)]"
            >
              {f.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.map((row, i) => (
          <tr
            key={i}
            className="border-b border-arch-border/50 last:border-0 even:bg-arch-bg3/25 hover:bg-arch-purple/[0.045] transition-colors"
          >
            {fields.map((f) => {
              const v = row[f.name];
              const isNull = v === null || v === undefined;
              const isNum = typeof v === "number";
              return (
                <td
                  key={f.name}
                  className={`px-3.5 py-1.5 font-mono whitespace-nowrap ${
                    isNull
                      ? "text-arch-text3 italic"
                      : isNum
                      ? "text-arch-blue tabular-nums text-right"
                      : "text-arch-text2"
                  }`}
                >
                  {formatCell(v)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
