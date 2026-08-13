import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIFFICULTIES } from "@/game/config";
import type { Question } from "@/game/types";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteQuestion,
  loadAllQuestions,
  resolveQuestionFlag,
  statsFor,
  updateQuestion,
} from "@/services/questionService";
import { StaffGate } from "@/components/StaffGate";

const TITLE = "Audit the IP Question Bank — Rakuten FLIP";
const DESCRIPTION =
  "Presenters and admins can search, review, correct and remove intellectual-property quiz questions in the Rakuten FLIP question bank.";

export const Route = createFileRoute("/questions")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuardedAuditPage,
});

const LETTERS = ["A", "B", "C", "D"] as const;

function AuditPage() {
  const auth = useAuth();
  const [bank, setBank] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("All");
  const [theme, setTheme] = useState<string>("All");
  const [status, setStatus] = useState<"flagged" | "live" | "all">("flagged");
  const [golden, setGolden] = useState<"All" | "Golden" | "Other">("All");
  const [fromDay, setFromDay] = useState(0);
  const [toDay, setToDay] = useState(0);
  const [editing, setEditing] = useState<Question | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadAllQuestions()
      .then(setBank)
      .catch(() => setMessage("The question bank is temporarily unavailable."));
  }, []);

  const stats = useMemo(() => statsFor(bank), [bank]);

  /** Flag dates drive the date-range slider (in whole days). */
  const flaggedDays = useMemo(() => {
    const stamps = bank
      .map((q) => (q.flagged_at ? Date.parse(q.flagged_at) : NaN))
      .filter((n) => Number.isFinite(n));
    if (stamps.length === 0) return null;
    const dayMs = 86_400_000;
    const min = Math.floor(Math.min(...stamps) / dayMs);
    const max = Math.floor(Math.max(...stamps) / dayMs);
    return { min, max, span: Math.max(0, max - min), dayMs };
  }, [bank]);

  useEffect(() => {
    if (flaggedDays) setToDay(flaggedDays.span);
  }, [flaggedDays]);

  const dayLabel = (offset: number) =>
    flaggedDays
      ? new Date((flaggedDays.min + offset) * flaggedDays.dayMs).toLocaleDateString()
      : "—";

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const lo = Math.min(fromDay, toDay);
    const hi = Math.max(fromDay, toDay);
    return bank
      .filter((q) =>
        status === "all" ? true : status === "flagged" ? !!q.under_review : !q.under_review,
      )
      .filter((q) => {
        if (golden === "All") return true;
        const isGolden = (q.record_type ?? "").toLowerCase() === "golden";
        return golden === "Golden" ? isGolden : !isGolden;
      })
      .filter((q) => {
        if (!flaggedDays || status === "live") return true;
        if (!q.flagged_at) return status !== "flagged";
        const day = Math.floor(Date.parse(q.flagged_at) / flaggedDays.dayMs) - flaggedDays.min;
        return day >= lo && day <= hi;
      })
      .filter((q) => (difficulty === "All" ? true : q.difficulty === difficulty))
      .filter((q) => (theme === "All" ? true : q.theme === theme))
      .filter((q) =>
        needle
          ? q.question.toLowerCase().includes(needle) || q.record_id.toLowerCase().includes(needle)
          : true,
      )
      .slice(0, 120);
  }, [bank, difficulty, theme, search, status, golden, fromDay, toDay, flaggedDays]);

  if (auth.loading) return <main className="p-8 text-sm text-muted-foreground">Checking access…</main>;

  if (!auth.isStaff) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-black uppercase text-foreground">Presenters &amp; admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">Question auditing requires presenter access.</p>
        <Button className="mt-5" asChild>
          <Link to="/">Back to menu</Link>
        </Button>
      </main>
    );
  }

  const save = async () => {
    if (!editing) return;
    try {
      await updateQuestion(editing.record_id, {
        question: editing.question,
        option_a: editing.option_a,
        option_b: editing.option_b,
        option_c: editing.option_c,
        option_d: editing.option_d,
        correct_option: editing.correct_option,
        correct_answer: editing.correct_answer,
      });
      setBank((prev) => prev.map((q) => (q.record_id === editing.record_id ? editing : q)));
      setMessage(
        `${editing.record_id} updated. It stays in review until you approve it back into gameplay.`,
      );
      setEditing(null);
    } catch {
      setMessage("Update failed. Nothing was changed.");
    }
  };

  /** Puts a rephrased question back into the playable bank. */
  const approve = async (recordId: string) => {
    try {
      await resolveQuestionFlag(recordId);
      setBank((prev) =>
        prev.map((q) =>
          q.record_id === recordId
            ? { ...q, under_review: false, flag_reason: null, flagged_at: null }
            : q,
        ),
      );
      setMessage(`${recordId} is back in gameplay.`);
    } catch {
      setMessage("Could not approve this question. Please try again.");
    }
  };

  const remove = async (recordId: string) => {
    try {
      await deleteQuestion(recordId);
      setBank((prev) => prev.filter((q) => q.record_id !== recordId));
      setMessage(`${recordId} removed from the bank.`);
    } catch {
      setMessage("Delete failed. Please try again.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link to="/" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
        ← Main menu
      </Link>
      <h1 className="mt-3 text-gradient-gold font-display text-3xl font-black uppercase tracking-tight">
        Audit questions
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {stats.total} questions · {stats.byDifficulty['Easy'] ?? 0} easy · {stats.byDifficulty['Medium'] ?? 0} medium ·{" "}
        {stats.byDifficulty['Hard'] ?? 0} hard · {bank.filter((q) => q.under_review).length} in review
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Input placeholder="Search question or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          {["All", ...DIFFICULTIES].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          {["All", ...stats.byTheme.map((t) => t.theme)].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <select
          aria-label="Review status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="flagged">Flagged for review</option>
          <option value="live">Live in gameplay</option>
          <option value="all">All questions</option>
        </select>
        <select
          aria-label="Data set"
          value={golden}
          onChange={(e) => setGolden(e.target.value as typeof golden)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="All">Any data set</option>
          <option value="Golden">Golden data set only</option>
          <option value="Other">Non-golden only</option>
        </select>
        {flaggedDays && status !== "live" ? (
          <div className="rounded-md border border-input bg-background px-3 py-2">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Flagged {dayLabel(Math.min(fromDay, toDay))} → {dayLabel(Math.max(fromDay, toDay))}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                aria-label="Flagged from date"
                type="range"
                min={0}
                max={flaggedDays.span}
                value={fromDay}
                onChange={(e) => setFromDay(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <input
                aria-label="Flagged to date"
                type="range"
                min={0}
                max={flaggedDays.span}
                value={toDay}
                onChange={(e) => setToDay(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>
          </div>
        ) : (
          <p className="self-center text-xs text-muted-foreground">
            No flag dates to filter on yet.
          </p>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-foreground">{message}</p>}

      <ul className="mt-5 space-y-3">
        {filtered.map((q) => {
          const isEditing = editing?.record_id === q.record_id;
          const row = isEditing ? editing! : q;
          return (
            <li key={q.record_id} className="rounded-xl border border-border bg-card/80 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-0.5">{q.record_id}</span>
                <span className="rounded-full border border-border px-2 py-0.5">{q.record_type}</span>
                <span className="rounded-full border border-border px-2 py-0.5">{q.theme}</span>
                <span className="rounded-full border border-border px-2 py-0.5">{q.difficulty}</span>
                {q.under_review && (
                  <span className="rounded-full border border-destructive px-2 py-0.5 text-destructive">
                    ⚑ In review — hidden from gameplay
                  </span>
                )}
              </div>
              {q.under_review && q.flag_reason && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reason: {q.flag_reason}
                  {q.flagged_at ? ` · flagged ${new Date(q.flagged_at).toLocaleString()}` : ""}
                </p>
              )}

              {isEditing ? (
                <div className="mt-3 space-y-2">
                  <Input value={row.question} onChange={(e) => setEditing({ ...row, question: e.target.value })} />
                  {LETTERS.map((letter) => {
                    const key = `option_${letter.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d";
                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({ ...row, correct_option: letter, correct_answer: row[key] })
                          }
                          className={
                            row.correct_option === letter
                              ? "h-8 w-8 rounded-full bg-success text-xs font-black text-success-foreground"
                              : "h-8 w-8 rounded-full border border-border text-xs font-black text-muted-foreground"
                          }
                          aria-label={`Mark ${letter} correct`}
                        >
                          {letter}
                        </button>
                        <Input value={row[key]} onChange={(e) => setEditing({ ...row, [key]: e.target.value })} />
                      </div>
                    );
                  })}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void save()}>
                      Save changes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-foreground">{q.question}</p>
                  <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {LETTERS.map((letter) => {
                      const key = `option_${letter.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d";
                      return (
                        <li
                          key={letter}
                          className={q.correct_option === letter ? "font-bold text-success" : undefined}
                        >
                          {letter}. {q[key]}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(q)}>
                      Rephrase
                    </Button>
                    {q.under_review && (
                      <Button size="sm" onClick={() => void approve(q.record_id)}>
                        Approve back into gameplay
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => void remove(q.record_id)}
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && <p className="mt-6 text-sm text-muted-foreground">No questions match the filters.</p>}
    </main>
  );
}

function GuardedAuditPage() {
  return (
    <StaffGate>
      <AuditPage />
    </StaffGate>
  );
}
