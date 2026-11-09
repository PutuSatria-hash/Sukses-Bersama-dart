import React, { useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Sparkles,
  Info,
  ArrowRightCircle,
} from 'lucide-react';
import type {
  RunExecutionResult,
  SubmitExecutionResult,
  TestCaseResult,
} from '../runner/execute';
import type { CompileDiagnostic } from '../runner/dartServices';
import type { EnhancedProblem, ProblemTestMeta } from '../types/problem';
import {
  buildRunExplanation,
  buildSubmitExplanation,
} from '../utils/outputExplainer';

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
  problem: EnhancedProblem;
  userCode: string;
  state: ExecutionState;
  tests: ProblemTestMeta[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onGotoLine: (line: number) => void;
}

function renderInlineCode(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={idx} className="inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
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
  problem,
  userCode,
  state,
  tests,
  collapsed,
  onToggleCollapsed,
  onGotoLine,
}) => {
  const getTestKind = (name: string): 'wajib' | 'saran' => {
    return tests.find((t) => t.name === name)?.kind ?? 'wajib';
  };

  const runReport = useMemo(() => {
    if (state.kind !== 'run') return null;
    return buildRunExplanation(problem, userCode, state.result);
  }, [state, problem, userCode]);

  const submitReport = useMemo(() => {
    if (state.kind !== 'submit') return null;
    return buildSubmitExplanation(problem, userCode, state.result);
  }, [state, problem, userCode]);

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
          <span>Panel Output & Penjelasan Hasil Kode</span>
          {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {!collapsed && (
        <div className="latih-results-body">
          {/* Verdict Banner */}
          {state.kind === 'idle' && (
            <p className="latih-verdict latih-verdict-idle">
              Siap diuji. Tekan <strong>Jalankan (Ctrl+Enter)</strong> untuk
              mengetes <code>void main()</code> sekaligus melihat penjelasan
              alur kodemu, atau <strong>Nilai (Ctrl+Shift+Enter)</strong> untuk
              penilaian penuh.
            </p>
          )}

          {state.kind === 'running' && (
            <p className="latih-verdict latih-verdict-running" role="status">
              {state.mode === 'run'
                ? 'Menjalankan fungsi void main() & menganalisis alur kodemu...'
                : 'Menilai jawaban dengan unit test soal...'}
            </p>
          )}

          {state.kind === 'run' && runReport && (
            <>
              {state.result.timedOut ? (
                <p className="latih-verdict latih-verdict-fail">
                  Timeout: program tidak selesai dalam batas waktu.
                </p>
              ) : state.result.jsError === null ? (
                <p
                  className={`latih-verdict ${
                    runReport.totalChecks > 0 &&
                    runReport.matchCount === runReport.totalChecks
                      ? 'latih-verdict-pass'
                      : runReport.matchCount > 0
                        ? 'latih-verdict-warn'
                        : 'latih-verdict-idle'
                  }`}
                >
                  <CheckCircle2 size={15} /> Eksekusi <code>void main()</code>{' '}
                  selesai ({state.result.stdout.length} baris output) —{' '}
                  {runReport.totalChecks > 0
                    ? `${runReport.matchCount}/${runReport.totalChecks} Uji Cocok`
                    : 'Selesai'}
                </p>
              ) : (
                <p className="latih-verdict latih-verdict-fail">
                  <XCircle size={15} /> Error saat jalan: {state.result.jsError}
                </p>
              )}

              {/* Automatic Code & Output Explanation Card */}
              <div className="output-explainer-card">
                <div className="explainer-head">
                  <Sparkles size={15} className="accent-icon" />
                  <strong>{runReport.headline}</strong>
                </div>

                <p className="explainer-flow-text">
                  {renderInlineCode(runReport.codeFlowSummary)}
                </p>

                {runReport.detectedConstructs.length > 0 && (
                  <div className="explainer-constructs">
                    <span className="constructs-label">
                      Sintaks yang terdeteksi di kodemu:
                    </span>
                    {runReport.detectedConstructs.map((c) => (
                      <span key={c} className="construct-chip">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="explainer-next-step">
                  <ArrowRightCircle size={14} className="next-icon" />
                  <span>{renderInlineCode(runReport.nextStepAdvice)}</span>
                </div>
              </div>

              {/* Line-by-Line Output + Explanation */}
              <div className="run-stdout-container">
                {runReport.lines.length === 0 ? (
                  <pre className="latih-stdout">
                    (tidak ada output dari print)
                  </pre>
                ) : (
                  <div className="latih-stdout-lines">
                    {runReport.lines.map((lineItem, idx) => (
                      <div
                        key={idx}
                        className={`stdout-item-card status-${lineItem.status}`}
                      >
                        <div className="stdout-line">
                          {lineItem.status === 'match' && (
                            <span className="stdout-badge pass">COCOK</span>
                          )}
                          {lineItem.status === 'mismatch' && (
                            <span className="stdout-badge fail">
                              BELUM COCOK
                            </span>
                          )}
                          {lineItem.status === 'neutral' && (
                            <span className="stdout-badge neutral">OUTPUT</span>
                          )}
                          <code>{lineItem.rawLine}</code>
                        </div>
                        <div className="stdout-line-explanation">
                          <Info size={13} className="exp-info-icon" />
                          <span>{renderInlineCode(lineItem.explanation)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {state.kind === 'submit' && submitReport && (
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
                      {total} test lulus ({total - passed} gagal).
                    </p>
                  );
                })()
              )}

              {/* Submit Explanation Summary Card */}
              <div className="output-explainer-card">
                <div className="explainer-head">
                  <Sparkles size={15} className="accent-icon" />
                  <strong>{submitReport.headline}</strong>
                </div>
                <p className="explainer-flow-text">
                  {renderInlineCode(submitReport.codeFlowSummary)}
                </p>
                <div className="explainer-next-step">
                  <ArrowRightCircle size={14} className="next-icon" />
                  <span>{renderInlineCode(submitReport.advice)}</span>
                </div>
              </div>

              <div className="submit-details">
                <h3 className="latih-results-heading">
                  Rincian Unit Test ({state.result.results.length})
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
                                Penjelasan & Solusi: {item.reason}
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
              <div className="output-explainer-card">
                <div className="explainer-head">
                  <AlertTriangle size={15} className="accent-icon" />
                  <strong>Mengapa Terjadi Error Compile?</strong>
                </div>
                <p className="explainer-flow-text">
                  Kompilator Dart menemukan penulisan sintaks yang belum sesuai
                  aturan (misalnya kurang titik koma <code>;</code>, kurung
                  kurawal belum ditutup, atau nama variabel salah ketik). Klik
                  tautan baris di bawah untuk langsung melompat ke baris yang
                  perlu diperbaiki.
                </p>
              </div>
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
