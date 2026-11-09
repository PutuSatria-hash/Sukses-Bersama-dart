import rawProblemsData from './problems.json';
import { enhanceProblem } from '../utils/problemEnhancer';
import type { RawProblem, EnhancedProblem, Level } from '../types/problem';

const rawList = rawProblemsData as RawProblem[];

export const ALL_PROBLEMS: EnhancedProblem[] = rawList.map(enhanceProblem);

export const LEVELS: Level[] = ['easy', 'medium', 'hard'];

export const LEVEL_LABELS: Record<Level, string> = {
  easy: 'Easy (Dasar)',
  medium: 'Medium (Menengah)',
  hard: 'Hard (Algoritma)',
};

export function getProblemsByLevel(level: Level): EnhancedProblem[] {
  return ALL_PROBLEMS.filter((p) => p.level === level).sort(
    (a, b) => a.order - b.order
  );
}

export function getProblemById(
  level: Level,
  id: string
): EnhancedProblem | null {
  return (
    ALL_PROBLEMS.find((p) => p.level === level && p.id === id) ??
    ALL_PROBLEMS.find((p) => p.id === id) ??
    null
  );
}

export function getNeighbors(
  level: Level,
  id: string
): { prev: EnhancedProblem | null; next: EnhancedProblem | null } {
  const list = getProblemsByLevel(level);
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? list[idx - 1] : null,
    next: idx + 1 < list.length ? list[idx + 1] : null,
  };
}

export function getTopicsForLevel(level: Level): string[] {
  const set = new Set<string>();
  for (const p of getProblemsByLevel(level)) {
    for (const t of p.topics) {
      set.add(t);
    }
  }
  return Array.from(set).sort();
}

export function getMaxPoints(problem: EnhancedProblem): number {
  return problem.tests.reduce((acc, t) => acc + Math.max(0, t.points), 0);
}

