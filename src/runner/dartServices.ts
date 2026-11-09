export const DART_SERVICES_URL = 'https://stable.api.dartpad.dev/';

const DEFAULT_TIMEOUT_MS = 45000;
const RETRY_DELAY_MS = 1000;
const MAX_ATTEMPTS = 2;

export interface CompileDiagnostic {
  line: number | null;
  column: number;
  message: string;
  internal: boolean;
}

export interface AnalyzeIssue {
  kind: string;
  message: string;
  line: number;
  column: number;
  code: string;
}

export class RunnerError extends Error {
  kind: 'compile' | 'rate-limit' | 'server' | 'timeout' | 'network';
  errors: CompileDiagnostic[];

  constructor(
    kind: 'compile' | 'rate-limit' | 'server' | 'timeout' | 'network',
    message: string,
    errors: CompileDiagnostic[] = []
  ) {
    super(message);
    this.name = 'RunnerError';
    this.kind = kind;
    this.errors = errors;
  }
}

const DIAGNOSTIC_REGEX =
  /^main\.dart:(\d+):(\d+):\s*(?:Error|Warning):\s*(.*)$/;

function parseCompileDiagnostics(
  rawText: string,
  userLineOffset: number
): CompileDiagnostic[] {
  const list: CompileDiagnostic[] = [];
  for (const rawLine of rawText.split('\n')) {
    const match = DIAGNOSTIC_REGEX.exec(rawLine.trim());
    if (!match) continue;
    const adjustedLine = Number(match[1]) - userLineOffset + 1;
    list.push({
      line: adjustedLine >= 1 ? adjustedLine : null,
      column: Number(match[2]),
      message: match[3],
      internal: adjustedLine < 1,
    });
  }
  return list;
}

function summarizeCompileErrors(errors: CompileDiagnostic[]): string {
  if (errors.length === 0) return 'Kode tidak bisa dikompilasi.';
  const first = errors[0];
  const loc = first.internal
    ? ' (kesalahan internal soal, bukan kodemu)'
    : first.line === null
      ? ''
      : ` di baris ${first.line}`;
  const extra =
    errors.length > 1 ? ` (+${errors.length - 1} kesalahan lain)` : '';
  return `Kode tidak bisa dikompilasi${loc}: ${first.message}${extra}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postDartService(
  endpoint: string,
  payload: unknown,
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<Response> {
  const url = `${DART_SERVICES_URL}api/v3/${endpoint}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onExternalAbort);

      if ((res.status >= 500 || res.status === 429) && attempt < MAX_ATTEMPTS) {
        await res.body?.cancel().catch(() => undefined);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onExternalAbort);
      if (options.signal?.aborted) throw err;
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  if (lastError instanceof DOMException && lastError.name === 'AbortError') {
    throw new RunnerError(
      'timeout',
      `Server compile tidak menjawab dalam ${Math.round(timeoutMs / 1000)} detik.`
    );
  }
  throw new RunnerError(
    'network',
    'Server compile DartPad tidak bisa dihubungi. Periksa koneksi internetmu lalu coba lagi.'
  );
}

export async function compileDDC(
  source: string,
  userLineOffset = 1,
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<string> {
  const res = await postDartService('compileNewDDC', { source }, options);
  if (res.status === 400) {
    const errors = parseCompileDiagnostics(await res.text(), userLineOffset);
    throw new RunnerError('compile', summarizeCompileErrors(errors), errors);
  }
  if (!res.ok) {
    throw new RunnerError(
      res.status === 429 ? 'rate-limit' : 'server',
      `Server compile menjawab ${res.status}. Tunggu sebentar lalu coba lagi.`
    );
  }
  const data = (await res.json()) as { result?: string };
  if (typeof data.result !== 'string' || data.result === '') {
    throw new RunnerError(
      'server',
      'Server compile menjawab tanpa hasil JS. Coba lagi sebentar.'
    );
  }
  return data.result;
}

export async function analyzeCode(
  source: string,
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<AnalyzeIssue[]> {
  const res = await postDartService('analyze', { source }, options);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    issues?: Array<{
      kind?: string;
      message?: string;
      location?: { line?: number; column?: number };
      code?: string;
    }>;
  };
  if (!Array.isArray(data.issues)) return [];
  return data.issues.map((item) => ({
    kind: typeof item.kind === 'string' ? item.kind : 'info',
    message: typeof item.message === 'string' ? item.message : '',
    line: typeof item.location?.line === 'number' ? item.location.line : 1,
    column:
      typeof item.location?.column === 'number' ? item.location.column : 1,
    code: typeof item.code === 'string' ? item.code : '',
  }));
}

export async function formatCode(source: string): Promise<string> {
  const res = await postDartService('format', { source });
  if (!res.ok) {
    throw new RunnerError(
      'server',
      `Format gagal: server menjawab ${res.status}.`
    );
  }
  const data = (await res.json()) as { source?: string };
  if (typeof data.source !== 'string' || data.source === '') {
    throw new RunnerError('server', 'Format gagal: server tanpa hasil.');
  }
  return data.source;
}

let cachedVersion: { dartVersion: string; flutterVersion: string } | null =
  null;
let versionPromise: Promise<{
  dartVersion: string;
  flutterVersion: string;
}> | null = null;

export function fetchDartVersion(): Promise<{
  dartVersion: string;
  flutterVersion: string;
}> {
  if (cachedVersion) return Promise.resolve(cachedVersion);
  if (!versionPromise) {
    versionPromise = fetch(`${DART_SERVICES_URL}api/v3/version`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed version');
        const data = (await res.json()) as {
          dartVersion?: string;
          flutterVersion?: string;
        };
        cachedVersion = {
          dartVersion: data.dartVersion ?? '3.x',
          flutterVersion: data.flutterVersion ?? '3.x',
        };
        return cachedVersion;
      })
      .catch(() => {
        versionPromise = null;
        return { dartVersion: '3.7.0', flutterVersion: '3.29.0' };
      });
  }
  return versionPromise;
}

let prewarmed = false;
export function prewarmCompiler(): void {
  if (prewarmed) return;
  prewarmed = true;
  fetchDartVersion().catch(() => undefined);
  compileDDC('void main() {}').catch(() => undefined);
}

