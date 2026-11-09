import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import type {
  RunExecutionResult,
  SubmitExecutionResult,
  TestCaseResult,
} from '../runner/execute';
import type { CompileDiagnostic } from '../runner/dartServices';
import type { ProblemTestMeta } from '../types/problem';

export type ExecutionState =
  | { kind: 'idle' }
  | { kind: 'running'; mode: 'run' | 'submit' }
  | { kind: 'run'; result: RunExecutionResult }
  | { kind: 'submit'; result: SubmitExecutionResult }
  | {
    kind: 'compile-error';
    errors: CompileDiagnostic[];
    summary: string;
    mode: 'run' | 'submit';
  }
  | { kind: 'failure'; title: string; detail: string };

interface ResultsDockProps {
  state: ExecutionState;
  tests: ProblemTestMeta[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onGotoLine: (line: number) => void;
}

function checkRunLineMatch(line: string): 'match' | 'mismatch' | 'neutral' {
  const m = line.match(/^Uji\s+\d+\s*->\s*Hasil:\s*(.*?)\s*\|\s*Ekspektasi:\s*(.*)$/);
  if (!m) return 'neutral';
  const actualRaw = m[1].trim();
  const expectedRaw = m[2].trim();
  const cleanExpected = expectedRaw.replace(/^'|'$/g, '').trim();
  if (
    actualRaw === expectedRaw ||
    actualRaw === cleanExpected ||
    (expectedRaw.includes('kosong') && (actualRaw === '[]' || actualRaw === '' || actualRaw === '{}'))
  ) {
    return 'match';
  }
  if (expectedRaw.startsWith('~') || expectedRaw.startsWith('contains(')) {
    return 'neutral';
  }
  return 'mismatch';
}

function splitExpectedActual(msg: string): {
  head: string;
  tail: string | null;
} {
  const idx = msg.indexOf('  Actual: ');
  if (!msg.startsWith('Expected: ') || idx < 0) {
    return { head: msg, tail: null };
  }
  return {
    head: msg.slice(0, idx),
    tail: `Actual: ${msg.slice(idx + 10)}`,
  };
}

export const ResultsDock: React.FC<ResultsDockProps> = ({
  state,
  tests,
  collapsed,
  onToggleCollapsed,
  onGotoLine,
}) => {
  const getTestKind = (name: string): 'wajib' | 'saran' => {
    return tests.find((t) => t.name === name)?.kind ?? 'wajib';
  };

  return (
    <section className="latih-results" aria-label="Hasil Eksekusi">
      <div className="latih-results-topbar">
        <button
          type="button"
          className="latih-results-toggle"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
        >
          <Terminal size={15} />
          <span>Panel Output & Hasil Pengujian</span>
          {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {!collapsed && (
        <div className="latih-results-body">
          {/* Verdict Banner */}
          {state.kind === 'idle' && (
            <p className="latih-verdict latih-verdict-idle">
              Siap diuji. Tekan <strong>Jalankan (Ctrl+Enter)</strong> untuk
              mengetes <code>void main()</code>, atau{' '}
              <strong>Nilai (Ctrl+Shift+Enter)</strong> untuk penilaian penuh.
            </p>
          )}

          {state.kind === 'running' && (
            <p className="latih-verdict latih-verdict-running" role="status">
              {state.mode === 'run'
                ? 'Menjalankan fungsi void main()...'
                : 'Menilai jawaban dengan unit test soal...'}
            </p>
          )}

          {state.kind === 'run' && (
            <>
              {state.result.timedOut ? (
                <p className="latih-verdict latih-verdict-fail">
                  Timeout: program tidak selesai dalam batas waktu.
                </p>
              ) : state.result.jsError === null ? (
                <p className="latih-verdict latih-verdict-pass">
                  <CheckCircle2 size={15} /> Eksekusi <code>void main()</code>{' '}
                  selesai ({state.result.stdout.length} baris output)
                  {state.result.usedAutoMain
                    ? ' — memakai void main() bawaan soal.'
                    : '.'}
                </p>
              ) : (
                <p className="latih-verdict latih-verdict-fail">
                  <XCircle size={15} /> Error saat jalan: {state.result.jsError}
                </p>
              )}

              <div className="run-stdout-container">
                {state.result.stdout.length === 0 ? (
                  <pre className="latih-stdout">(tidak ada output dari print)</pre>
                ) : (
                  <div className="latih-stdout-lines">
                    {state.result.stdout.map((line, idx) => {
                      const status = checkRunLineMatch(line);
                      return (
                        <div
                          key={idx}
                          className={`stdout-line stdout-${status}`}
                        >
                          {status === 'match' && (
                            <span className="stdout-badge pass">COCOK</span>
                          )}
                          {status === 'mismatch' && (
                            <span className="stdout-badge fail">BELUM COCOK</span>
                          )}
                          <code>{line}</code>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {state.kind === 'submit' && (
            <>
              {state.result.incompleteReason !== null ? (
                <p className="latih-verdict latih-verdict-fail">
                  <XCircle size={15} /> {state.result.incompleteReason}
                </p>
              ) : (
                (() => {
                  const passed =
                    state.result.summary?.passed ??
                    state.result.results.filter((r) => r.status === 'pass')
                      .length;
                  const total = state.result.results.length;
                  const allPassed = passed === total && total > 0;
                  return allPassed ? (
                    <p className="latih-verdict latih-verdict-pass">
                      <CheckCircle2 size={15} /> Sempurna! Lulus semua ({passed}/
                      {total} test).
                    </p>
                  ) : (
                    <p className="latih-verdict latih-verdict-fail">
                      <XCircle size={15} /> Belum lulus penuh: {passed} dari{' '}
                      {total} test lulus ({total - passed} gagal). Periksa detail
                      di bawah.
                    </p>
                  );
                })()
              )}

              <div className="submit-details">
                <h3 className="latih-results-heading">
                  Daftar Unit Test ({state.result.results.length})
                </h3>
                <ul className="latih-test-list">
                  {state.result.results.map((item: TestCaseResult) => {
                    const { head, tail } = splitExpectedActual(item.message);
                    const kind = getTestKind(item.name);
                    return (
                      <li
                        key={item.name}
                        className={`latih-test latih-test-${item.status}`}
                      >
                        <div className="latih-test-row">
                          <span className="latih-test-head">
                            {item.status === 'pass' ? '✓' : '✗'} {item.name}
                          </span>
                          <span className={`latih-kind latih-kind-${kind}`}>
                            {kind}
                          </span>
                          <span className="latih-duration">
                            {item.durationMs} ms
                          </span>
                        </div>
                        {item.status !== 'pass' && head !== '' && (
                          <div className="latih-message">
                            <div>{head}</div>
                            {tail !== null && <div>{tail}</div>}
                            {item.reason !== '' && (
                              <div className="latih-reason">
                                Petunjuk: {item.reason}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {state.result.stdout.length > 0 && (
                  <>
                    <h3 className="latih-results-heading">Output print()</h3>
                    <pre className="latih-stdout">
                      {state.result.stdout.join('\n')}
                    </pre>
                  </>
                )}
              </div>
            </>
          )}

          {state.kind === 'compile-error' && (
            <>
              <p className="latih-verdict latih-verdict-warn">
                <AlertTriangle size={15} /> Error Compile: {state.summary}
              </p>
              {state.errors.length > 0 && (
                <ul className="latih-error-list">
                  {state.errors.map((err, idx) => (
                    <li key={idx}>
                      {err.line === null ? (
                        <span className="latih-error-internal">
                          [soal] {err.message}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="latih-error-link"
                          onClick={() => onGotoLine(err.line ?? 1)}
                        >
                          Baris {err.line}: {err.message} (Klik untuk lompat ke
                          baris)
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {state.kind === 'failure' && (
            <p className="latih-verdict latih-verdict-fail">
              <XCircle size={15} /> {state.title}: {state.detail}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

