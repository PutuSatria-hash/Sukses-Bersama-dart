import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Code2,
  User,
} from 'lucide-react';
import type { EnhancedProblem } from '../types/problem';
import type { ExecutionState } from './ResultsDock';
import {
  generateDosenWelcome,
  answerUserQuestion,
  DOSEN_QUESTION_CATEGORIES,
  type DosenMessage,
} from '../utils/dosenPintarEngine';

interface DosenPintarChatProps {
  problem: EnhancedProblem;
  userCode: string;
  execState: ExecutionState;
  onApplySolution: (solutionCode: string) => void;
}

function renderInlineFormatted(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
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
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const MessageContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

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
      const codeStr = codeLines.join('\n');
      const currentKey = blockKey++;

      elements.push(
        <div key={currentKey} className="dosen-codeblock">
          <div className="dosen-codeblock-bar">
            <span>{lang.toUpperCase()}</span>
            <button
              type="button"
              className="md-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(codeStr);
                setCopiedBlock(currentKey);
                setTimeout(() => setCopiedBlock(null), 1600);
              }}
            >
              {copiedBlock === currentKey ? (
                <>
                  <Check size={12} /> Tersalin
                </>
              ) : (
                <>
                  <Copy size={12} /> Salin Kode
                </>
              )}
            </button>
          </div>
          <pre>
            <code>{codeStr}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={blockKey++} className="dosen-msg-h3">
          {renderInlineFormatted(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={blockKey++} className="dosen-msg-h4">
          {renderInlineFormatted(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      elements.push(
        <blockquote key={blockKey++} className="dosen-msg-quote">
          {renderInlineFormatted(line.trim().slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet or numbered list
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={blockKey++} className="dosen-msg-list">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInlineFormatted(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={blockKey++} className="dosen-msg-p">
        {renderInlineFormatted(line)}
      </p>
    );
    i++;
  }

  return <div className="dosen-msg-body">{elements}</div>;
};

export const DosenPintarChat: React.FC<DosenPintarChatProps> = ({
  problem,
  userCode,
  execState,
  onApplySolution,
}) => {
  const [messages, setMessages] = useState<DosenMessage[]>(() => [
    generateDosenWelcome(problem),
  ]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    DOSEN_QUESTION_CATEGORIES[0].id
  );
  const [inputText, setInputText] = useState('');
  const [appliedMsgId, setAppliedMsgId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Reset conversation to welcome message when problem changes
  useEffect(() => {
    setMessages([generateDosenWelcome(problem)]);
    setInputText('');
    setAppliedMsgId(null);
  }, [problem]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const activeCategory =
    DOSEN_QUESTION_CATEGORIES.find((c) => c.id === activeCategoryId) ||
    DOSEN_QUESTION_CATEGORIES[0];

  const handleSendQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    const userMsg: DosenMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const dosenReply = answerUserQuestion(
      trimmed,
      problem,
      userCode,
      execState
    );

    setMessages((prev) => [...prev, userMsg, dosenReply]);
    setInputText('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuestion(inputText);
  };

  const handleResetChat = () => {
    setMessages([generateDosenWelcome(problem)]);
    setAppliedMsgId(null);
  };

  return (
    <div className="dosen-chat-wrap">
      {/* Header Card */}
      <div className="dosen-header-card">
        <div className="dosen-header-left">
          <div className="dosen-avatar-badge">
            <GraduationCap size={18} />
          </div>
          <div>
            <div className="dosen-title-row">
              <h2>Dosen Pintar Dart</h2>
              <span className="dosen-online-pill">Live Code Analyzer</span>
            </div>
            <p>
              Membaca kode kamu secara langsung untuk menjawab langkah
              selanjutnya, fungsi tiap baris kode, hingga kunci jawaban soal{' '}
              <strong>{problem.id}</strong>.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="dosen-reset-btn"
          onClick={handleResetChat}
          title="Bersihkan riwayat diskusi"
        >
          <RotateCcw size={13} />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Categorized Question Explorer Bar */}
      <div className="dosen-quick-bar">
        <div className="dosen-cat-tabs">
          <span className="dosen-quick-label">
            <Sparkles size={12} /> Kategori Pertanyaan:
          </span>
          {DOSEN_QUESTION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`dosen-cat-tab ${
                activeCategoryId === cat.id ? 'active' : ''
              }`}
              onClick={() => setActiveCategoryId(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="dosen-quick-chips">
          {activeCategory.questions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="dosen-chip-btn"
              onClick={() => handleSendQuestion(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="dosen-messages-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`dosen-msg-row ${
              msg.sender === 'user' ? 'is-user' : 'is-dosen'
            }`}
          >
            <div className="dosen-msg-bubble">
              <div className="dosen-msg-meta">
                <span className="dosen-msg-author">
                  {msg.sender === 'dosen' ? (
                    <>
                      <GraduationCap size={13} /> Dosen Pintar
                    </>
                  ) : (
                    <>
                      <User size={13} /> Kamu
                    </>
                  )}
                </span>
                <span className="dosen-msg-time">{msg.timestamp}</span>
              </div>

              <MessageContentRenderer content={msg.text} />

              {/* One-click Apply Solution to Editor button */}
              {msg.solutionCode && (
                <div className="dosen-solution-actions">
                  <button
                    type="button"
                    className={`dosen-apply-btn ${
                      appliedMsgId === msg.id ? 'applied' : ''
                    }`}
                    onClick={() => {
                      onApplySolution(msg.solutionCode!);
                      setAppliedMsgId(msg.id);
                      setTimeout(() => setAppliedMsgId(null), 2500);
                    }}
                  >
                    {appliedMsgId === msg.id ? (
                      <>
                        <Check size={14} /> Jawaban Terpasang di Editor!
                      </>
                    ) : (
                      <>
                        <Code2 size={14} /> Pasang Jawaban ke Editor (Pertahankan void main)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Suggested follow-up chips on Dosen messages */}
              {msg.sender === 'dosen' &&
                msg.suggestedFollowUps &&
                msg.suggestedFollowUps.length > 0 && (
                  <div className="dosen-followup-wrap">
                    {msg.suggestedFollowUps.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        className="dosen-followup-btn"
                        onClick={() => handleSendQuestion(followUp)}
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form className="dosen-input-form" onSubmit={handleFormSubmit}>
        <input
          type="text"
          className="dosen-input-field"
          placeholder={`Ketik bebas: "langkah selanjutnya apa?", "fungsi \`trim()\` apa?", "jelaskan baris 2"...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          className="dosen-send-btn"
          disabled={!inputText.trim()}
        >
          <Send size={14} />
          <span>Tanya Dosen</span>
        </button>
      </form>
    </div>
  );
};
