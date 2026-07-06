"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";
import { Play, RotateCcw, Database, Loader2, Table2, AlertCircle, Terminal, Network, ChevronDown, Lightbulb, BookOpen, ListChecks, Zap } from "lucide-react";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import CodeBlock from "@/components/ui/CodeBlock";
import {
  SEED_SQL,
  SCHEMA_TABLES,
  EXAMPLE_QUERIES,
  ER_DIAGRAM,
  MODELLING_CHALLENGES,
  type ModellingChallenge,
} from "@/data/sql-practice";
import {
  CHEAT_SECTIONS,
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

const DEFAULT_QUERY = "";

const MAX_DISPLAY_ROWS = 500;

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function SqlPracticeTab() {
  const dbRef = useRef<PGlite | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("query");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<ResultSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  // Load a challenge's reference SQL into the editor and jump to Query mode.
  const loadIntoEditor = useCallback((sql: string) => {
    setQuery(sql);
    setError(null);
    setResult(null);
    setMode("query");
  }, []);

  // Initialise a fresh in-memory Postgres and load the seed once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { PGlite } = await import("@electric-sql/pglite");
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

  const runQuery = useCallback(async () => {
    const db = dbRef.current;
    if (!db || running) return;
    const sql = query.trim();
    if (!sql) return;

    setRunning(true);
    setError(null);
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
  }, [query, running]);

  const resetDatabase = useCallback(async () => {
    const db = dbRef.current;
    if (!db || resetting) return;
    setResetting(true);
    setError(null);
    try {
      await db.exec(SEED_SQL);
      setResult(null);
      setElapsedMs(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  }, [resetting]);

  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  };

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
    <div className="h-full flex overflow-hidden">
      {/* ── Sidebar: schema + examples ─────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-r border-arch-border bg-arch-bg2 overflow-y-auto">
        <div className="px-4 py-3.5 border-b border-arch-border sticky top-0 bg-arch-bg2 z-10">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-arch-purple" />
            <h2 className="text-sm font-semibold text-arch-text">SQL Playground</h2>
          </div>
          <p className="text-[11px] text-arch-text2 mt-1 leading-relaxed">
            Real Postgres in your browser · HOOPP member-portal / DISP dataset
          </p>
        </div>

        {/* Example queries */}
        <div className="px-3 py-3">
          <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-arch-text3 mb-1.5">
            Example queries
          </h3>
          <div className="space-y-0.5">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setQuery(ex.sql)}
                className="group w-full text-left px-2.5 py-1.5 rounded-md hover:bg-arch-bg3 transition-colors"
              >
                <div className="text-[12.5px] text-arch-text group-hover:text-arch-purple transition-colors">
                  {ex.label}
                </div>
                <div className="text-[10px] font-mono text-arch-text3">{ex.concept}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Schema reference */}
        <div className="px-3 py-3 border-t border-arch-border">
          <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-arch-text3 mb-2">
            Schema
          </h3>
          <div className="space-y-3">
            {SCHEMA_TABLES.map((t) => (
              <div key={t.name} className="rounded-lg border border-arch-border overflow-hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-arch-bg3 border-b border-arch-border">
                  <Table2 className="w-3 h-3 text-arch-teal" />
                  <span className="text-[12px] font-mono font-medium text-arch-text">
                    {t.name}
                  </span>
                </div>
                <div className="px-2.5 py-1.5 space-y-0.5">
                  {t.columns.map((c) => (
                    <div key={c.name} className="flex items-baseline gap-2 text-[11px]">
                      <span className="font-mono text-arch-text2">{c.name}</span>
                      <span className="font-mono text-arch-text3">{c.type}</span>
                      {c.note && (
                        <span className="ml-auto text-[9.5px] font-mono text-arch-blue/80">
                          {c.note}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main: editor + results ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-arch-border bg-arch-bg2">
          {/* Mode segmented toggle */}
          <div className="flex items-center rounded-md border border-arch-border p-0.5 bg-arch-bg3">
            {MODE_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12.5px] font-medium transition-colors ${
                  mode === key
                    ? "bg-arch-bg2 text-arch-text shadow-sm"
                    : "text-arch-text2 hover:text-arch-text"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {mode === "query" && (
            <>
              <button
                onClick={runQuery}
                disabled={!dbReady || running}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-arch-purple text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {running ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run
                <span className="ml-1 text-[10px] opacity-70 font-mono">⌘↵</span>
              </button>

              <button
                onClick={resetDatabase}
                disabled={!dbReady || resetting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-arch-border text-arch-text2 text-[13px] hover:bg-arch-bg3 disabled:opacity-40 transition-colors"
                title="Drop and reseed the database"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
                Reset
              </button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono">
            {!dbReady && !initError ? (
              <span className="flex items-center gap-1.5 text-arch-text3">
                <Loader2 className="w-3 h-3 animate-spin" /> booting postgres…
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-arch-green">
                <span className="w-1.5 h-1.5 rounded-full bg-arch-green" /> ready
              </span>
            )}
            {mode === "query" && elapsedMs !== null && (
              <span className="text-arch-text3">· {elapsedMs} ms</span>
            )}
          </div>
        </div>

        {mode === "query" ? (
          <>
            {/* Editor */}
            <div className="border-b border-arch-border bg-[#282c34]">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onEditorKeyDown}
                spellCheck={false}
                className="w-full h-52 resize-y px-4 py-3 bg-transparent text-[13px] leading-relaxed font-mono text-[#abb2bf] placeholder:text-[#5c6370] outline-none"
                placeholder="Write SQL here — e.g. find members whose beneficiary allocations don't total 100%. Cmd/Ctrl+Enter to run. Pick an example on the left to get started."
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-auto bg-arch-bg">
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
              ) : result ? (
                <ResultsTable result={result} />
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-arch-text3">
                    <Table2 className="w-7 h-7 mx-auto mb-2 opacity-50" />
                    <p className="text-[13px]">Run a query to see results</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : mode === "learn" ? (
          <CheatSheetView onLoad={loadIntoEditor} />
        ) : mode === "drills" ? (
          <DrillsView onLoad={loadIntoEditor} />
        ) : (
          <ModellingView onLoad={loadIntoEditor} />
        )}
      </main>
    </div>
  );
}

// ─── Cheat sheet ─────────────────────────────────────────────────────────────

function CheatSheetView({ onLoad }: { onLoad: (sql: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-arch-bg">
      <div className="max-w-4xl mx-auto p-5 space-y-6">
        <p className="text-[12.5px] text-arch-text2 leading-relaxed">
          A refresher from <span className="font-mono text-arch-purple">SELECT</span> to
          window functions — every snippet runs against the seeded dataset, so hit{" "}
          <span className="font-medium text-arch-text">Load into editor</span> and run it.
          Work top to bottom, then move to the Drills tab.
        </p>

        {CHEAT_SECTIONS.map((s, i) => (
          <CheatSectionCard key={s.title} section={s} index={i + 1} onLoad={onLoad} />
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
    </section>
  );
}

// ─── Drills ──────────────────────────────────────────────────────────────────

function DrillsView({ onLoad }: { onLoad: (sql: string) => void }) {
  return (
    <div className="flex-1 overflow-auto bg-arch-bg">
      <div className="max-w-4xl mx-auto p-5 space-y-3">
        <p className="text-[12.5px] text-arch-text2 leading-relaxed">
          Ten drills, easiest to hardest. Write each one in the Query tab{" "}
          <span className="font-medium text-arch-text">before</span> revealing the
          solution — if your result matches but your SQL differs, that&apos;s fine; there
          are many right answers. The drills hunt the data problems planted in the seed.
        </p>
        {DRILLS.map((d, i) => (
          <DrillCard key={d.skill} drill={d} index={i + 1} onLoad={onLoad} />
        ))}
      </div>
    </div>
  );
}

function DrillCard({
  drill,
  index,
  onLoad,
}: {
  drill: Drill;
  index: number;
  onLoad: (sql: string) => void;
}) {
  const [open, setOpen] = useState(false);
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
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-arch-purple hover:opacity-80"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
          {open ? "Hide solution" : "Reveal solution"}
        </button>
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
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-mono text-arch-text3">
        <span className="text-arch-text2">{rows.length}</span> row
        {rows.length === 1 ? "" : "s"}
        {rows.length > MAX_DISPLAY_ROWS && (
          <span className="text-arch-amber">
            · showing first {MAX_DISPLAY_ROWS}
          </span>
        )}
      </div>
      <div className="rounded-lg border border-arch-border overflow-x-auto bg-arch-bg2">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-arch-border">
              {fields.map((f) => (
                <th
                  key={f.name}
                  className="text-left px-3 py-2 font-mono font-semibold text-arch-text whitespace-nowrap bg-arch-bg3"
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
                className="border-b border-arch-border/60 last:border-0 hover:bg-arch-bg3/50"
              >
                {fields.map((f) => {
                  const v = row[f.name];
                  const isNull = v === null || v === undefined;
                  const isNum = typeof v === "number";
                  return (
                    <td
                      key={f.name}
                      className={`px-3 py-1.5 font-mono whitespace-nowrap ${
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
      </div>
    </div>
  );
}
