import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { csvTemplate, downloadCsv, validateCsv, type ParseResult } from "@/services/csvService";
import {
  insertQuestions,
  loadQuestionBank,
  replaceQuestionBank,
  statsFor,
  type BankStats,
} from "@/services/questionService";

const TITLE = "Question Bank & CSV Import — Business of IP";
const DESCRIPTION =
  "Inspect the intellectual-property question bank by theme and difficulty, and import or replace questions from a validated CSV file.";

export const Route = createFileRoute("/questions")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: QuestionsPage;
});

function QuestionsPage() {
  const [stats, setStats] = useState<BankStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => {
    loadQuestionBank(true)
      .then((bank) => setStats(statsFor(bank)))
      .catch(() => setLoadError("The question bank is temporarily unavailable."));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleFile = async (file: File) => {
    setMessage(null);
    const text = await file.text();
    const existing = new Set((await loadQuestionBank()).map((q) => q.record_id));
    setPreview(validateCsv(text, existing));
  };

  const commit = async (mode: "append" | "replace") => {
    if (!preview?.valid.length) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "replace") await replaceQuestionBank(preview.valid);
      else await insertQuestions(preview.valid);
      setMessage(
        `${preview.valid.length} question(s) ${mode === "replace" ? "replaced the bank" : "imported"}.`,
      );
      setPreview(null);
      refresh();
    } catch {
      setMessage("Import failed. Nothing was changed — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground underline hover:text-foreground">
        ← Back to game
      </Link>
      <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-foreground">
        Question bank
      </h1>

      {loadError && <p className="mt-4 text-sm text-foreground">{loadError}</p>}

      {stats && (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
              <p className="mt-1 font-display text-2xl font-black text-foreground">{stats.total}</p>
            </div>
            {(["Easy", "Medium", "Hard"] as const).map((d) => (
              <div key={d} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{d}</p>
                <p className="mt-1 font-display text-2xl font-black text-foreground">
                  {stats.byDifficulty[d] ?? 0}
                </p>
              </div>
            ))}
          </section>

          <h2 className="mt-8 font-display text-lg font-black uppercase tracking-widest text-foreground">
            Themes
          </h2>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {stats.byTheme.map((t) => (
              <li
                key={t.theme}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="truncate text-foreground">{t.theme}</span>
                <span className="tabular-nums text-muted-foreground">{t.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-10 font-display text-lg font-black uppercase tracking-widest text-foreground">
        Import from CSV
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Required columns: Record_ID, Difficulty, Theme, Question, Option_A–D, Correct_Option,
        Correct_Answer.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Choose a CSV file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="text-sm text-foreground"
        />
        <Button variant="outline" size="sm" onClick={() => downloadCsv("ip-questions-template.csv", csvTemplate())}>
          Download template
        </Button>
      </div>

      {message && <p className="mt-4 text-sm text-foreground">{message}</p>}

      {preview && (
        <div className="mt-5 rounded-xl border border-border bg-card p-4">
          {preview.fileError ? (
            <p className="text-sm text-foreground">{preview.fileError}</p>
          ) : (
            <>
              <p className="text-sm text-foreground">
                {preview.totalRows} row(s) read · {preview.valid.length} valid ·{" "}
                {preview.invalid.length} invalid · {preview.duplicatesInFile.length} duplicate(s) in file ·{" "}
                {preview.existingDuplicates.length} already in bank
              </p>
              {preview.invalid.length > 0 && (
                <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {preview.invalid.slice(0, 50).map((row) => (
                    <li key={`${row.row}-${row.recordId}`}>
                      Row {row.row} ({row.recordId}): {row.message}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={busy || preview.valid.length === 0} onClick={() => void commit("append")}>
                  Import valid rows
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || preview.valid.length === 0}
                  onClick={() => void commit("replace")}
                >
                  Replace entire bank
                </Button>
                <Button variant="ghost" onClick={() => setPreview(null)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}