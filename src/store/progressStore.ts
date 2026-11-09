import { useSyncExternalStore } from 'react';
import { z } from 'zod';

export type ProblemStatus = 'belum' | 'dicoba' | 'lulus';

export interface ProblemProgress {
  status: ProblemStatus;
  bestPoints: number;
  lastSubmitAt: string | null;
  attempts: number;
}

export interface ProgressState {
  progress: Record<string, ProblemProgress>;
  code: Record<string, string>;
}

const PROGRESS_STORAGE_KEY = 'latih:progress';
const CODE_PREFIX = 'latih:code:';

const ProblemProgressSchema = z.object({
  status: z.enum(['belum', 'dicoba', 'lulus']),
  bestPoints: z.number().nonnegative().finite(),
  lastSubmitAt: z.string().nullable().optional(),
  attempts: z.number().int().nonnegative(),
});

const ExportPayloadSchema = z.object({
  v: z.number(),
  progress: z.record(z.string(), z.unknown()).optional(),
  code: z.record(z.string(), z.unknown()).optional(),
});

function emptyState(): ProgressState {
  return { progress: {}, code: {} };
}

function readFromStorage(storage: Storage | null): {
  state: ProgressState;
  warning: string | null;
} {
  if (!storage) return { state: emptyState(), warning: null };
  let raw: string | null = null;
  try {
    raw = storage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return {
      state: emptyState(),
      warning: 'Penyimpanan browser tidak dapat diakses.',
    };
  }
  if (!raw) return { state: emptyState(), warning: null };

  try {
    const parsed = JSON.parse(raw);
    const check = ExportPayloadSchema.safeParse(parsed);
    if (!check.success || check.data.v !== 1 || !check.data.progress) {
      return {
        state: emptyState(),
        warning: 'Data progres rusak sehingga direset.',
      };
    }

    const progress: Record<string, ProblemProgress> = {};
    for (const [id, val] of Object.entries(check.data.progress)) {
      const item = ProblemProgressSchema.safeParse(val);
      if (item.success) {
        progress[id] = {
          status: item.data.status,
          bestPoints: item.data.bestPoints,
          lastSubmitAt: item.data.lastSubmitAt ?? null,
          attempts: item.data.attempts,
        };
      }
    }

    const code: Record<string, string> = {};
    if (check.data.code) {
      for (const [id, val] of Object.entries(check.data.code)) {
        if (typeof val === 'string') code[id] = val;
      }
    }

    return { state: { progress, code }, warning: null };
  } catch {
    return {
      state: emptyState(),
      warning: 'Data progres tidak valid dan direset.',
    };
  }
}

class ProgressStore {
  private storage: Storage | null;
  private current: ProgressState;
  private warning: string | null;
  private listeners = new Set<() => void>();

  constructor(storage: Storage | null) {
    this.storage = storage;
    const loaded = readFromStorage(storage);
    this.current = loaded.state;
    this.warning = loaded.warning;

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === PROGRESS_STORAGE_KEY) this.reload();
      });
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): ProgressState => this.current;
  getWarning = (): string | null => this.warning;

  private emit() {
    for (const l of this.listeners) l();
  }

  private persist() {
    if (!this.storage) return;
    try {
      this.storage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
          v: 1,
          progress: this.current.progress,
          code: this.current.code,
        })
      );
      this.warning = null;
    } catch {
      this.warning = 'Gagal menyimpan progres ke browser.';
    }
  }

  reload() {
    const loaded = readFromStorage(this.storage);
    this.current = loaded.state;
    this.warning = loaded.warning;
    this.emit();
  }

  submit(problemId: string, result: { passed: boolean; points: number }) {
    const prev = this.current.progress[problemId];
    const status: ProblemStatus =
      result.passed || prev?.status === 'lulus' ? 'lulus' : 'dicoba';
    const safePoints = Number.isFinite(result.points)
      ? Math.max(0, result.points)
      : 0;

    this.current = {
      ...this.current,
      progress: {
        ...this.current.progress,
        [problemId]: {
          status,
          bestPoints: Math.max(prev?.bestPoints ?? 0, safePoints),
          lastSubmitAt: new Date().toISOString(),
          attempts: (prev?.attempts ?? 0) + 1,
        },
      },
    };
    this.persist();
    this.emit();
  }

  saveCode(problemId: string, codeText: string) {
    this.current = {
      ...this.current,
      code: {
        ...this.current.code,
        [problemId]: codeText,
      },
    };
    if (this.storage) {
      try {
        this.storage.setItem(`${CODE_PREFIX}${problemId}`, codeText);
      } catch { }
    }
    this.persist();
    this.emit();
  }

  replaceAll(next: ProgressState) {
    this.current = {
      progress: { ...next.progress },
      code: { ...next.code },
    };
    if (this.storage) {
      for (const [id, c] of Object.entries(next.code)) {
        try {
          this.storage.setItem(`${CODE_PREFIX}${id}`, c);
        } catch { }
      }
    }
    this.persist();
    this.emit();
  }

  clear() {
    if (this.storage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < this.storage.length; i++) {
          const k = this.storage.key(i);
          if (k && k.startsWith(CODE_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => this.storage?.removeItem(k));
      } catch { }
    }
    this.current = emptyState();
    this.persist();
    this.emit();
  }
}

let singletonStore: ProgressStore | null = null;

export function getProgressStore(): ProgressStore {
  if (!singletonStore) {
    singletonStore = new ProgressStore(
      typeof localStorage !== 'undefined' ? localStorage : null
    );
  }
  return singletonStore;
}

export function useProgressStore() {
  const store = getProgressStore();
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const warning = useSyncExternalStore(store.subscribe, store.getWarning);
  return { state, warning, store };
}

export function loadProblemCode(
  problemId: string,
  starterWithMain: string,
  rawStarter: string
): string {
  try {
    const saved = localStorage.getItem(`${CODE_PREFIX}${problemId}`);
    if (!saved || saved.trim() === rawStarter.trim()) {
      return starterWithMain;
    }
    return saved;
  } catch {
    return starterWithMain;
  }
}

export function exportProgressJson(state: ProgressState): string {
  return JSON.stringify(
    {
      v: 1,
      exportedAt: new Date().toISOString(),
      progress: state.progress,
      code: state.code,
    },
    null,
    2
  );
}

export function parseImportedProgressJson(rawJson: string): ProgressState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Berkas bukan JSON yang valid.');
  }
  const check = ExportPayloadSchema.safeParse(parsed);
  if (!check.success || check.data.v !== 1 || !check.data.progress) {
    throw new Error('Format berkas progres tidak sesuai standar.');
  }
  const progress: Record<string, ProblemProgress> = {};
  for (const [id, val] of Object.entries(check.data.progress)) {
    const item = ProblemProgressSchema.safeParse(val);
    if (item.success) {
      progress[id] = {
        status: item.data.status,
        bestPoints: item.data.bestPoints,
        lastSubmitAt: item.data.lastSubmitAt ?? null,
        attempts: item.data.attempts,
      };
    }
  }
  const code: Record<string, string> = {};
  if (check.data.code) {
    for (const [id, val] of Object.entries(check.data.code)) {
      if (typeof val === 'string') code[id] = val;
    }
  }
  return { progress, code };
}

