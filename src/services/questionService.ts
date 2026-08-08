import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTIES, THEME_GROUPS, type BoardTheme, type Difficulty } from "@/game/config";
import type { Question } from "@/game/types";

let cache: Question[] | null = null;

export async function loadQuestionBank(force = false): Promise<Question[]> {
  if (cache && !force) return cache;
  const all: Question[] = [];
  const pageSize = 1000;
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from("questions")
      .select(
        "record_id, record_type, difficulty, theme, question, option_a, option_b, option_c, option_d, correct_option, correct_answer",
      )
      .order("record_id")
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw error;
    all.push(...((data ?? []) as unknown as Question[]));
    if (!data || data.length < pageSize) break;
  }
  cache = all;
  return all;
}

export function clearQuestionCache() {
  cache = null;
}

function matchesTheme(question: Question, theme: BoardTheme) {
  const raw = THEME_GROUPS[theme].map((t) => t.toLowerCase());
  return raw.includes(question.theme.toLowerCase());
}

export function poolFor(
  bank: Question[],
  theme: BoardTheme,
  difficulty: Difficulty,
  usedIds: string[],
): Question[] {
  const used = new Set(usedIds);
  return bank.filter(
    (q) => q.difficulty === difficulty && matchesTheme(q, theme) && !used.has(q.record_id),
  );
}

/** Random pick that never violates the theme + difficulty requirement. */
export function pickQuestion(
  bank: Question[],
  theme: BoardTheme,
  difficulty: Difficulty,
  usedIds: string[],
  excludeRecordId?: string,
  goldenFirst = false,
): Question | null {
  let pool = poolFor(bank, theme, difficulty, usedIds);
  if (excludeRecordId && pool.length > 1) pool = pool.filter((q) => q.record_id !== excludeRecordId);
  if (pool.length === 0) return null;
  if (goldenFirst) {
    const golden = pool.filter((q) => q.record_type?.toLowerCase() === "golden");
    if (golden.length > 0) return golden[Math.floor(Math.random() * golden.length)] ?? null;
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function alternativesFor(bank: Question[], theme: BoardTheme, difficulty: Difficulty, usedIds: string[]) {
  const otherDifficulties = DIFFICULTIES.filter((d) => d !== difficulty)
    .map((d) => ({ difficulty: d, count: poolFor(bank, theme, d, usedIds).length }))
    .filter((x) => x.count > 0);
  const otherThemes = (Object.keys(THEME_GROUPS) as BoardTheme[])
    .filter((t) => t !== theme)
    .map((t) => ({ theme: t, count: poolFor(bank, t, difficulty, usedIds).length }))
    .filter((x) => x.count > 0);
  return { otherDifficulties, otherThemes };
}

export type BankStats = {
  total: number;
  byDifficulty: Record<string, number>;
  byTheme: { theme: string; count: number }[];
};

export function statsFor(bank: Question[]): BankStats {
  const byDifficulty: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  const themeMap = new Map<string, number>();
  for (const q of bank) {
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
    themeMap.set(q.theme, (themeMap.get(q.theme) ?? 0) + 1);
  }
  return {
    total: bank.length,
    byDifficulty,
    byTheme: [...themeMap.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function insertQuestions(rows: Question[]) {
  const chunkSize = 250;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase
      .from("questions")
      .upsert(rows.slice(i, i + chunkSize) as never, { onConflict: "record_id" });
    if (error) throw error;
  }
  clearQuestionCache();
}

export async function replaceQuestionBank(rows: Question[]) {
  const { error } = await supabase.from("questions").delete().neq("record_id", "__none__");
  if (error) throw error;
  await insertQuestions(rows);
}

export async function existingRecordIds(): Promise<Set<string>> {
  const bank = await loadQuestionBank();
  return new Set(bank.map((q) => q.record_id));
}
export async function updateQuestion(recordId: string, patch: Partial<Question>) {
  const { error } = await supabase
    .from("questions")
    .update(patch as never)
    .eq("record_id", recordId);
  if (error) throw error;
  clearQuestionCache();
}

export async function deleteQuestion(recordId: string) {
  const { error } = await supabase.from("questions").delete().eq("record_id", recordId);
  if (error) throw error;
  clearQuestionCache();
}
