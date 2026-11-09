import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Terminal,
  Code2,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Lightbulb,
  Layers,
  GraduationCap,
} from 'lucide-react';
import type { EnhancedProblem, CodelineExplanation } from '../types/problem';
import type { ExecutionState } from './ResultsDock';
import { DosenPintarChat } from './DosenPintarChat';

interface BriefAndSyntaxPanelProps {
  problem: EnhancedProblem;
  userCode: string;
  execState: ExecutionState;
  onInsertOrResetMain: () => void;
  onApplySolution: (solutionCode: string) => void;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_)/g);
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
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const MarkdownBriefRenderer: React.FC<{ markdown: string }> = ({
  markdown,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const elements = useMemo(() => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const out: React.ReactNode[] = [];
    let i = 0;
    let keyCounter = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim() === '') {
        i++;
        continue;
      }

      // Fenced code block
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'dart';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const codeContent = codeLines.join('\n');
        const blockId = keyCounter++;
        out.push(
          <div key={blockId} className="md-codeblock">
            <div className="md-codeblock-header">
              <span className="md-codeblock-lang">{lang}</span>
              <button
                type="button"
                className="md-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(codeContent);
                  setCopiedIdx(blockId);
                  setTimeout(() => setCopiedIdx(null), 1600);
                }}
              >
                {copiedIdx === blockId ? (
                  <>
                    <Check size={13} /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Salin
                  </>
                )}
              </button>
            </div>
            <pre>
              <code>{codeContent}</code>
            </pre>
          </div>
        );
        continue;
      }

      // Headings
      const hMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const content = renderInlineMarkdown(hMatch[2]);
        if (level === 1) {
          out.push(<h1 key={keyCounter++}>{content}</h1>);
        } else if (level === 2) {
          out.push(<h2 key={keyCounter++}>{content}</h2>);
        } else {
          out.push(<h3 key={keyCounter++}>{content}</h3>);
        }
        i++;
        continue;
      }

      // Table
      if (
        line.trim().startsWith('|') &&
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('|') &&
        lines[i + 1].includes('---')
      ) {
        const headers = line
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim());
        i += 2; // skip header & separator
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          rows.push(
            lines[i]
              .trim()
              .replace(/^\||\|$/g, '')
              .split('|')
              .map((c) => c.trim())
          );
          i++;
        }
        out.push(
          <div key={keyCounter++} className="latih-table-wrap">
            <table>
              <thead>
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx}>{renderInlineMarkdown(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, rIdx) => (
                  <tr key={rIdx}>
                    {r.map((cell, cIdx) => (
                      <td key={cIdx}>{renderInlineMarkdown(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Unordered list
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
          i++;
        }
        out.push(
          <ul key={keyCounter++} className="md-list">
            {items.map((it, idx) => (
              <li key={idx}>{renderInlineMarkdown(it)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
          i++;
        }
        out.push(
          <ol key={keyCounter++} className="md-list">
            {items.map((it, idx) => (
              <li key={idx}>{renderInlineMarkdown(it)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // Paragraph
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('#') &&
        !lines[i].trim().startsWith('|') &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i])
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      out.push(
        <p key={keyCounter++} className="md-para">
          {renderInlineMarkdown(paraLines.join(' '))}
        </p>
      );
    }

    return out;
  }, [markdown, copiedIdx]);

  return <div className="latih-brief">{elements}</div>;
};

export const BriefAndSyntaxPanel: React.FC<BriefAndSyntaxPanelProps> = ({
  problem,
  userCode,
  execState,
  onInsertOrResetMain,
  onApplySolution,
}) => {
  const [activeTab, setActiveTab] = useState<
    'soal' | 'main-guide' | 'sintaks' | 'dosen'
  >('soal');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedMain, setCopiedMain] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>(['Semua']);
    for (const item of problem.codelineExplanations) {
      set.add(item.category);
    }
    return Array.from(set);
  }, [problem.codelineExplanations]);

  const filteredExplanations = useMemo(() => {
    if (selectedCategory === 'Semua') return problem.codelineExplanations;
    return problem.codelineExplanations.filter(
      (item) => item.category === selectedCategory
    );
  }, [problem.codelineExplanations, selectedCategory]);

  const handleCopySnippet = (token: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1600);
  };

  const handleCopyMain = () => {
    navigator.clipboard.writeText(problem.mainTestBlock);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 1600);
  };

  return (
    <div className="brief-panel-wrapper">
      {/* Sub-navigation Tabs */}
      <div className="brief-subtabs" role="tablist" aria-label="Mode Petunjuk">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'soal'}
          className={`brief-subtab ${activeTab === 'soal' ? 'active' : ''}`}
          onClick={() => setActiveTab('soal')}
        >
          <BookOpen size={15} />
          <span>Petunjuk Soal</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'main-guide'}
          className={`brief-subtab ${activeTab === 'main-guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('main-guide')}
        >
          <Terminal size={15} />
          <span>Cara Buat void main()</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sintaks'}
          className={`brief-subtab ${activeTab === 'sintaks' ? 'active' : ''}`}
          onClick={() => setActiveTab('sintaks')}
        >
          <Code2 size={15} />
          <span>Bedah Kode ({problem.codelineExplanations.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dosen'}
          className={`brief-subtab dosen-tab ${activeTab === 'dosen' ? 'active' : ''}`}
          onClick={() => setActiveTab('dosen')}
        >
          <GraduationCap size={15} />
          <span>Dosen Pintar</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="brief-panel-scroll">
        {activeTab === 'soal' && (
          <div className="tab-fade-in">
            {/* Quick Highlight Banner */}
            <div className="learning-shortcut-card">
              <div className="learning-shortcut-info">
                <Sparkles size={16} className="accent-icon" />
                <div>
                  <strong>Fitur Testing, Bedah Kode & Dosen Pintar Aktif:</strong>{' '}
                  Soal ini sudah dilengkapi blok <code>void main()</code> di
                  editor. Tanyakan cara menjawab, arti fungsi, atau jawaban
                  seharusnya pada <strong>Dosen Pintar</strong> di tab atas.
                </div>
              </div>
              <div className="learning-shortcut-actions">
                <button
                  type="button"
                  className="shortcut-pill-btn"
                  onClick={() => setActiveTab('main-guide')}
                >
                  Panduan void main()
                </button>
                <button
                  type="button"
                  className="shortcut-pill-btn"
                  onClick={() => setActiveTab('sintaks')}
                >
                  Bedah Fungsi Kode ({problem.codelineExplanations.length})
                </button>
                <button
                  type="button"
                  className="shortcut-pill-btn primary"
                  onClick={() => setActiveTab('dosen')}
                >
                  <GraduationCap size={13} /> Tanya Dosen Pintar
                </button>
              </div>
            </div>

            <MarkdownBriefRenderer markdown={problem.brief} />

            {/* Inline Quick Syntax Preview at Bottom of Brief */}
            <div className="inline-syntax-summary">
              <div className="inline-syntax-header">
                <h3>
                  <Layers size={16} /> Ringkasan Fungsi Baris Kode di Soal Ini
                </h3>
                <button
                  type="button"
                  className="shortcut-pill-btn"
                  onClick={() => setActiveTab('sintaks')}
                >
                  Lihat Detail Lengkap →
                </button>
              </div>
              <div className="inline-syntax-grid">
                {problem.codelineExplanations.slice(0, 6).map((item) => (
                  <div key={item.token} className="inline-syntax-mini-card">
                    <div className="mini-card-top">
                      <code className="mini-token">{item.token}</code>
                      <span className="mini-cat">{item.category}</span>
                    </div>
                    <p className="mini-desc">{item.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'main-guide' && (
          <div className="tab-fade-in main-guide-container">
            <div className="guide-hero-box">
              <h2>Cara Membuat Fungsi void main() untuk Testing Soal {problem.id}</h2>
              <p>
                Di Dart, fungsi <code>void main()</code> adalah pintu masuk
                utama untuk menjalankan program. Dengan menulis{' '}
                <code>void main()</code> di bawah kode jawabanmu, kamu bisa
                menekan tombol <strong>Jalankan (Ctrl+Enter)</strong> untuk
                memeriksa apakah keluaran fungsimu sudah benar sebelum dinilai.
              </p>
              <div className="guide-hero-buttons">
                <button
                  type="button"
                  className="guide-action-btn primary"
                  onClick={onInsertOrResetMain}
                >
                  <RotateCcw size={14} /> Pasang / Reset void main() di Editor
                </button>
                <button
                  type="button"
                  className="guide-action-btn"
                  onClick={handleCopyMain}
                >
                  {copiedMain ? <Check size={14} /> : <Copy size={14} />}
                  {copiedMain ? 'Tersalin!' : 'Salin Kode void main()'}
                </button>
              </div>
            </div>

            <div className="steps-timeline">
              {problem.mainGuideSteps.map((step) => (
                <div key={step.stepNumber} className="step-card">
                  <div className="step-badge">Langkah {step.stepNumber}</div>
                  <h3>{step.title}</h3>
                  <p>{renderInlineMarkdown(step.explanation)}</p>
                  <pre className="step-code">
                    <code>{step.codeSnippet}</code>
                  </pre>
                </div>
              ))}
            </div>

            <div className="full-main-preview">
              <div className="full-main-header">
                <span>Template Lengkap void main() — Soal {problem.id}</span>
                <button
                  type="button"
                  className="md-copy-btn"
                  onClick={handleCopyMain}
                >
                  {copiedMain ? (
                    <>
                      <Check size={13} /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Salin Semua
                    </>
                  )}
                </button>
              </div>
              <pre>
                <code>{problem.mainTestBlock}</code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'sintaks' && (
          <div className="tab-fade-in syntax-guide-container">
            <div className="syntax-header-box">
              <h2>Bedah Fungsi Baris Kode & Sintaks ({problem.id})</h2>
              <p>
                Penjelasan lengkap setiap kata kunci, tipe data, dan method yang
                digunakan pada soal <strong>{problem.title}</strong> agar mudah
                diingat sekaligus langsung diterapkan.
              </p>

              <div className="syntax-category-pills">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="syntax-cards-list">
              {filteredExplanations.map((item: CodelineExplanation) => (
                <div key={item.token} className="syntax-card">
                  <div className="syntax-card-head">
                    <code className="syntax-token-badge">{item.token}</code>
                    <span className="syntax-category-tag">{item.category}</span>
                  </div>
                  <h3 className="syntax-summary">{item.summary}</h3>
                  <p className="syntax-detail">
                    {renderInlineMarkdown(item.detail)}
                  </p>

                  <div className="syntax-example-wrap">
                    <div className="syntax-example-bar">
                      <span>Contoh Penerapan Codeline:</span>
                      <button
                        type="button"
                        className="md-copy-btn"
                        onClick={() =>
                          handleCopySnippet(item.token, item.exampleCode)
                        }
                      >
                        {copiedToken === item.token ? (
                          <>
                            <Check size={12} /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Salin Contoh
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="syntax-example-code">
                      <code>{item.exampleCode}</code>
                    </pre>
                  </div>

                  <div className="syntax-memory-tip">
                    <Lightbulb size={14} className="tip-icon" />
                    <span>{renderInlineMarkdown(item.memoryTip)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'dosen' && (
          <div className="tab-fade-in">
            <DosenPintarChat
              problem={problem}
              userCode={userCode}
              execState={execState}
              onApplySolution={onApplySolution}
            />
          </div>
        )}
      </div>
    </div>
  );
};

