import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Play,
  CheckCircle2,
  Wand2,
  RotateCcw,
  Terminal,
  ArrowLeft,
  ArrowRight,
  ListFilter,
  Sun,
  Moon,
} from 'lucide-react';
import { getProblemById, getNeighbors } from '../data/catalog';
import {
  getProgressStore,
  loadProblemCode,
} from '../store/progressStore';
import { useTheme } from '../store/themeStore';
import {
  analyzeCode,
  formatCode,
  prewarmCompiler,
  RunnerError,
  type AnalyzeIssue,
  type CompileDiagnostic,
} from '../runner/dartServices';
import {
  runUserCode,
  submitUserCode,
  type TestCaseResult,
} from '../runner/execute';
import { LATIH_HARNESS } from '../runner/harness';
import { DartEditor } from '../components/DartEditor';
import { BriefAndSyntaxPanel } from '../components/BriefAndSyntaxPanel';
import { ResultsDock, type ExecutionState } from '../components/ResultsDock';
import type { EnhancedProblem, Level, ProblemTestMeta } from '../types/problem';

function computeScore(
  expectedTests: ProblemTestMeta[],
  actualResults: TestCaseResult[]
): { passed: boolean; points: number } {
  const statusMap = new Map(actualResults.map((r) => [r.name, r.status]));
  let points = 0;
  let allPassed = actualResults.length > 0;

  for (const t of expectedTests) {
    const st = statusMap.get(t.name);
    if (st === 'pass') {
      points += Math.max(0, t.points);
    } else {
      allPassed = false;
    }
  }

  for (const r of actualResults) {
    if (!expectedTests.some((t) => t.name === r.name) && r.status !== 'pass') {
      allPassed = false;
    }
  }

  return { passed: allPassed, points };
}

function replaceOrAppendMainBlock(
  currentCode: string,
  newMainBlock: string
): string {
  // Check if there is a CODELINE TESTING banner or void/Future main()
  const bannerIdx = currentCode.indexOf(
    '// =========================================================================\n// CODELINE TESTING'
  );
  if (bannerIdx >= 0) {
    const before = currentCode.slice(0, bannerIdx).trimEnd();
    return `${before}\n\n${newMainBlock}\n`;
  }

  const mainMatch = currentCode.match(
    /(^|\n)\s*(Future\s*<\s*void\s*>\s+|Future\s+|void\s+)?main\s*\(\s*\)/
  );
  if (mainMatch && mainMatch.index !== undefined) {
    const before = currentCode.slice(0, mainMatch.index).trimEnd();
    return `${before}\n\n${newMainBlock}\n`;
  }

  return `${currentCode.trimEnd()}\n\n${newMainBlock}\n`;
}

export const ProblemPage: React.FC = () => {
  const { level, id } = useParams<{ level: string; id: string }>();
  const validLevel =
    level === 'easy' || level === 'medium' || level === 'hard'
      ? (level as Level)
      : null;
  const problem =
    validLevel && id ? getProblemById(validLevel, id) : null;

  if (!problem) {
    return (
      <main className="latih-home">
        <h1>Soal tidak ditemukan</h1>
        <p>
          Soal <code>{`${level ?? '?'}/${id ?? '?'}`}</code> tidak ditemukan.
        </p>
        <p>
          <Link to="/" className="problem-link">
            ← Kembali ke daftar soal
          </Link>
        </p>
      </main>
    );
  }

  return <ProblemWorkspace key={problem.id} problem={problem} />;
};

const ProblemWorkspace: React.FC<{ problem: EnhancedProblem }> = ({
  problem,
}) => {
  const store = getProgressStore();
  const { theme, toggleTheme } = useTheme();

  const [code, setCode] = useState<string>(() =>
    loadProblemCode(problem.id, problem.starterWithMain, problem.starter)
  );
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const [execState, setExecState] = useState<ExecutionState>({ kind: 'idle' });
  const [resultsCollapsed, setResultsCollapsed] = useState(false);
  const [analyzeIssues, setAnalyzeIssues] = useState<AnalyzeIssue[]>([]);
  const [compileErrors, setCompileErrors] = useState<CompileDiagnostic[]>([]);
  const [gotoRequest, setGotoRequest] = useState<{
    line: number;
    seq: number;
  } | null>(null);
  const [externalCode, setExternalCode] = useState<{
    code: string;
    seq: number;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busyMode, setBusyMode] = useState<'run' | 'submit' | null>(null);

  // Split pane width percentage for desktop
  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const isDraggingRef = useRef(false);
  const panelsContainerRef = useRef<HTMLDivElement | null>(null);

  // Narrow viewport detection
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 60rem)').matches
  );
  const [mobileTab, setMobileTab] = useState<'kode' | 'soal'>('kode');

  const runnerMountRef = useRef<HTMLDivElement | null>(null);
  const busyLockRef = useRef(false);

  const { prev, next } = useMemo(
    () => getNeighbors(problem.level, problem.id),
    [problem.level, problem.id]
  );

  useEffect(() => {
    document.title = `${problem.id}: ${problem.title} — Sukses Bersama Dart`;
    prewarmCompiler();
  }, [problem.id, problem.title]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 60rem)');
    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Debounced code persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      store.saveCode(problem.id, code);
    }, 450);
    return () => clearTimeout(timer);
  }, [code, problem.id, store]);

  // Debounced static analysis
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      analyzeCode(code)
        .then((issues) => {
          if (!cancelled) setAnalyzeIssues(issues);
        })
        .catch(() => {
          if (!cancelled) setAnalyzeIssues([]);
        });
    }, 850);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  // Drag separator handler
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !panelsContainerRef.current) return;
      const rect = panelsContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidthPct(Math.max(28, Math.min(72, pct)));
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleGotoLine = useCallback(
    (line: number) => {
      setGotoRequest((prevReq) => ({
        line,
        seq: (prevReq?.seq ?? 0) + 1,
      }));
      if (isNarrow) setMobileTab('kode');
    },
    [isNarrow]
  );

  const handleRun = useCallback(async () => {
    const mount = runnerMountRef.current;
    if (!mount || busyLockRef.current) return;
    busyLockRef.current = true;
    setBusyMode('run');
    setCompileErrors([]);
    setExecState({ kind: 'running', mode: 'run' });
    setResultsCollapsed(false);

    try {
      const res = await runUserCode(
        mount,
        codeRef.current,
        problem.mainTestBlock,
        problem.timeoutMs
      );
      setExecState({ kind: 'run', result: res });
    } catch (err) {
      if (err instanceof RunnerError && err.kind === 'compile') {
        setCompileErrors(err.errors);
        setExecState({
          kind: 'compile-error',
          errors: err.errors,
          summary: err.message,
          mode: 'run',
        });
      } else {
        setExecState({
          kind: 'failure',
          title: 'Gagal menjalankan void main()',
          detail: err instanceof Error ? err.message : 'Kesalahan tak dikenal.',
        });
      }
    } finally {
      busyLockRef.current = false;
      setBusyMode(null);
    }
  }, [problem.mainTestBlock, problem.timeoutMs]);

  const handleSubmit = useCallback(async () => {
    const mount = runnerMountRef.current;
    if (!mount || busyLockRef.current) return;
    busyLockRef.current = true;
    setBusyMode('submit');
    setCompileErrors([]);
    setExecState({ kind: 'running', mode: 'submit' });
    setResultsCollapsed(false);

    try {
      const res = await submitUserCode(mount, {
        userCode: codeRef.current,
        testCode: problem.test,
        harness: LATIH_HARNESS,
        timeoutMs: problem.timeoutMs,
      });
      setExecState({ kind: 'submit', result: res });
      if (res.incompleteReason === null) {
        const score = computeScore(problem.tests, res.results);
        store.submit(problem.id, {
          passed: score.passed,
          points: score.points,
        });
      }
    } catch (err) {
      if (err instanceof RunnerError && err.kind === 'compile') {
        setCompileErrors(err.errors);
        setExecState({
          kind: 'compile-error',
          errors: err.errors,
          summary: err.message,
          mode: 'submit',
        });
      } else {
        setExecState({
          kind: 'failure',
          title: 'Penilaian gagal',
          detail: err instanceof Error ? err.message : 'Kesalahan tak dikenal.',
        });
      }
    } finally {
      busyLockRef.current = false;
      setBusyMode(null);
    }
  }, [problem.id, problem.test, problem.tests, problem.timeoutMs, store]);

  const handleFormat = useCallback(async () => {
    try {
      const formatted = await formatCode(codeRef.current);
      setCode(formatted);
      setExternalCode((prevExt) => ({
        code: formatted,
        seq: (prevExt?.seq ?? 0) + 1,
      }));
      setNotice('Kode berhasil dirapikan (diformat).');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Format kode gagal.');
    }
  }, []);

  const handleInsertOrResetMain = useCallback(() => {
    const updated = replaceOrAppendMainBlock(
      codeRef.current,
      problem.mainTestBlock
    );
    setCode(updated);
    setExternalCode((prevExt) => ({
      code: updated,
      seq: (prevExt?.seq ?? 0) + 1,
    }));
    setNotice(
      'Blok testing void main() berhasil dipasang di bagian bawah editor!'
    );
    if (isNarrow) setMobileTab('kode');
  }, [problem.mainTestBlock, isNarrow]);

  const handleResetToStarter = useCallback(() => {
    if (confirmReset) {
      setConfirmReset(false);
      setCode(problem.starterWithMain);
      setExternalCode((prevExt) => ({
        code: problem.starterWithMain,
        seq: (prevExt?.seq ?? 0) + 1,
      }));
      setCompileErrors([]);
      setNotice('Kode dikembalikan ke starter awal + void main().');
    } else {
      setConfirmReset(true);
      setNotice(
        'Kembalikan ke kode starter awal? Perubahan saat ini akan diganti.'
      );
    }
  }, [confirmReset, problem.starterWithMain]);

  return (
    <main className={`latih-work ${isNarrow ? 'latih-narrow' : ''}`}>
      {/* Header Bar */}
      <header className="latih-head">
        <div className="work-title-group">
          <span className={`work-level-badge level-${problem.level}`}>
            {problem.id}
          </span>
          <h1>{problem.title}</h1>
        </div>

        <nav aria-label="Navigasi Soal" className="work-nav">
          {prev && (
            <Link
              to={`/soal/${prev.level}/${prev.id}`}
              className="work-nav-link"
              title={`Soal sebelumnya: ${prev.title}`}
            >
              <ArrowLeft size={14} />
              <span>{prev.id}</span>
            </Link>
          )}
          <Link to="/" className="work-nav-link home-link">
            <ListFilter size={14} />
            <span>Daftar Soal</span>
          </Link>
          {next && (
            <Link
              to={`/soal/${next.level}/${next.id}`}
              className="work-nav-link"
              title={`Soal berikutnya: ${next.title}`}
            >
              <span>{next.id}</span>
              <ArrowRight size={14} />
            </Link>
          )}
          <button
            type="button"
            className="latih-theme-toggle"
            onClick={toggleTheme}
            title="Ganti tema tampilan"
          >
            {theme === 'gelap' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </nav>
      </header>

      {/* Action Toolbar */}
      <div className="latih-toolbar" role="toolbar" aria-label="Aksi Editor">
        <div className="latih-toolbar-group latih-toolbar-primary">
          <button
            type="button"
            className="toolbar-btn run-btn"
            onClick={handleRun}
            disabled={busyMode !== null}
            title="Jalankan void main() dan lihat hasil print() (Ctrl+Enter)"
          >
            <Play size={14} />
            <span>
              {busyMode === 'run' ? 'Menjalankan...' : 'Jalankan (void main)'}
            </span>
          </button>

          <button
            type="button"
            className="toolbar-btn latih-primary"
            onClick={handleSubmit}
            disabled={busyMode !== null}
            title="Nilai jawaban terhadap seluruh unit test soal (Ctrl+Shift+Enter)"
          >
            <CheckCircle2 size={14} />
            <span>
              {busyMode === 'submit' ? 'Menilai...' : 'Nilai Jawaban'}
            </span>
          </button>

          <button
            type="button"
            className="toolbar-btn main-helper-btn"
            onClick={handleInsertOrResetMain}
            disabled={busyMode !== null}
            title="Pasang atau kembalikan blok void main() tanpa menghapus kode fungsi di atasnya"
          >
            <Terminal size={14} />
            <span>Reset void main()</span>
          </button>
        </div>

        <div className="latih-toolbar-group latih-toolbar-secondary">
          <button
            type="button"
            className="toolbar-btn"
            onClick={handleFormat}
            disabled={busyMode !== null}
            title="Rapikan format kode Dart (Shift+Alt+F)"
          >
            <Wand2 size={14} />
            <span>Format</span>
          </button>

          {confirmReset ? (
            <div className="reset-confirm-inline">
              <span className="latih-reset-prompt">Reset kode?</span>
              <button
                type="button"
                onClick={handleResetToStarter}
                className="toolbar-btn latih-danger-armed"
              >
                Ya, Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="toolbar-btn"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResetToStarter}
              className="toolbar-btn latih-danger"
              title="Kembalikan seluruh editor ke kode starter awal"
            >
              <RotateCcw size={14} />
              <span>Ulangi</span>
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="latih-notice-bar" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="latih-notice-close"
            onClick={() => setNotice(null)}
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Split Workspace */}
      {isNarrow ? (
        <>
          <div className="latih-mode-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'kode'}
              onClick={() => setMobileTab('kode')}
            >
              Editor & Output
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'soal'}
              onClick={() => setMobileTab('soal')}
            >
              Soal, Panduan main() & Bedah Kode
            </button>
          </div>

          <div className="latih-narrow-pane">
            {mobileTab === 'kode' ? (
              <>
                <div className="latih-editor-wrap">
                  <DartEditor
                    problemId={problem.id}
                    initialCode={code}
                    analyzeIssues={analyzeIssues}
                    compileErrors={compileErrors}
                    gotoRequest={gotoRequest}
                    externalCode={externalCode}
                    onChange={setCode}
                    onRun={handleRun}
                    onSubmit={handleSubmit}
                    onFormat={handleFormat}
                  />
                </div>
                <ResultsDock
                  state={execState}
                  tests={problem.tests}
                  collapsed={resultsCollapsed}
                  onToggleCollapsed={() => setResultsCollapsed((c) => !c)}
                  onGotoLine={handleGotoLine}
                />
              </>
            ) : (
              <div className="latih-brief-col">
                <BriefAndSyntaxPanel
                  problem={problem}
                  onInsertOrResetMain={handleInsertOrResetMain}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div ref={panelsContainerRef} className="latih-panels">
          <div
            className="latih-code-col"
            style={{ width: `${leftWidthPct}%`, flex: 'none' }}
          >
            <div className="latih-editor-wrap">
              <DartEditor
                problemId={problem.id}
                initialCode={code}
                analyzeIssues={analyzeIssues}
                compileErrors={compileErrors}
                gotoRequest={gotoRequest}
                externalCode={externalCode}
                onChange={setCode}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onFormat={handleFormat}
              />
            </div>
            <ResultsDock
              state={execState}
              tests={problem.tests}
              collapsed={resultsCollapsed}
              onToggleCollapsed={() => setResultsCollapsed((c) => !c)}
              onGotoLine={handleGotoLine}
            />
          </div>

          <div
            className="latih-separator"
            role="separator"
            aria-orientation="vertical"
            title="Geser untuk mengubah lebar panel"
            onMouseDown={() => {
              isDraggingRef.current = true;
            }}
          />

          <div className="latih-brief-col" style={{ flex: 1 }}>
            <BriefAndSyntaxPanel
              problem={problem}
              onInsertOrResetMain={handleInsertOrResetMain}
            />
          </div>
        </div>
      )}

      {/* Hidden Sandbox Mount */}
      <div ref={runnerMountRef} hidden aria-hidden="true" />
    </main>
  );
};

