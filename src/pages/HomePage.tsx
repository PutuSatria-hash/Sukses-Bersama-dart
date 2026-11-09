import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Terminal,
  BookOpen,
  Sparkles,
  Search,
  Shuffle,
  Download,
  Upload,
  Trash2,
  Sun,
  Moon,
  CheckCircle2,
  Clock,
  CircleDot,
} from 'lucide-react';
import {
  LEVELS,
  LEVEL_LABELS,
  getProblemsByLevel,
  getTopicsForLevel,
  getMaxPoints,
  ALL_PROBLEMS,
} from '../data/catalog';
import {
  useProgressStore,
  exportProgressJson,
  parseImportedProgressJson,
  type ProblemStatus,
} from '../store/progressStore';
import { useTheme } from '../store/themeStore';
import type { Level } from '../types/problem';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  belum: 'Belum',
  dicoba: 'Dicoba',
  lulus: 'Lulus',
};

export const HomePage: React.FC = () => {
  const { state, warning, store } = useProgressStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [level, setLevel] = useState<Level>('easy');
  const [filter, setFilter] = useState<{
    status: 'semua' | ProblemStatus;
    topic: string;
    query: string;
  }>({
    status: 'semua',
    topic: 'semua',
    query: '',
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    document.title = 'Sukses Bersama Dart — Latihan & Bedah Kode Interaktif';
  }, []);

  const problemsInLevel = useMemo(() => getProblemsByLevel(level), [level]);
  const topicsInLevel = useMemo(() => getTopicsForLevel(level), [level]);

  const filteredProblems = useMemo(() => {
    return problemsInLevel.filter((p) => {
      const progStatus: ProblemStatus =
        state.progress[p.id]?.status ?? 'belum';
      if (filter.status !== 'semua' && progStatus !== filter.status) {
        return false;
      }
      if (filter.topic !== 'semua' && !p.topics.includes(filter.topic)) {
        return false;
      }
      const q = filter.query.trim().toLowerCase();
      if (q !== '') {
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchTopic = p.topics.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchId && !matchTopic) return false;
      }
      return true;
    });
  }, [problemsInLevel, state.progress, filter]);

  const statsSummary = useMemo(() => {
    let totalPassed = 0;
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    for (const p of ALL_PROBLEMS) {
      const maxPts = getMaxPoints(p);
      maxPossiblePoints += maxPts;
      const prog = state.progress[p.id];
      if (prog?.status === 'lulus') totalPassed++;
      if (prog?.bestPoints) totalPoints += prog.bestPoints;
    }
    return {
      totalPassed,
      totalProblems: ALL_PROBLEMS.length,
      totalPoints,
      maxPossiblePoints,
    };
  }, [state.progress]);

  const getLevelProgress = (lvl: Level) => {
    const list = getProblemsByLevel(lvl);
    const selesai = list.filter(
      (p) => state.progress[p.id]?.status === 'lulus'
    ).length;
    return { selesai, total: list.length };
  };

  const handleRandomUnfinished = () => {
    const candidates = problemsInLevel.filter(
      (p) => state.progress[p.id]?.status !== 'lulus'
    );
    if (candidates.length === 0) {
      setNotice('Semua soal pada level ini sudah lulus!');
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    navigate(`/soal/${pick.level}/${pick.id}`);
  };

  const handleExport = () => {
    const blob = new Blob([exportProgressJson(state)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sukses-bersama-dart-progres.json';
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Progres & kode berhasil diekspor ke berkas JSON.');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseImportedProgressJson(text);
      store.replaceAll(imported);
      setNotice('Impor berhasil: progres dan kode telah dipulihkan.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Impor gagal.');
    }
  };

  const handleClearProgress = () => {
    if (confirmClear) {
      store.clear();
      setConfirmClear(false);
      setNotice('Seluruh progres dan kode berhasil direset.');
    } else {
      setConfirmClear(true);
      setNotice(
        'Yakin ingin menghapus semua progres dan kode? Klik tombol konfirmasi sekali lagi.'
      );
    }
  };

  return (
    <main className="latih-home">
      {/* Hero Header */}
      <header className="home-hero-card">
        <div className="home-hero-top">
          <div className="brand-badge">
            <Sparkles size={14} />
            <span>EDISI INTERAKTIF 2.0</span>
          </div>
          <button
            type="button"
            className="latih-theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'gelap' ? <Sun size={15} /> : <Moon size={15} />}
            <span>Mode {theme === 'gelap' ? 'Terang' : 'Gelap'}</span>
          </button>
        </div>

        <h1 className="home-title">Sukses Bersama Dart</h1>
        <p className="home-subtitle">
          Platform latihan pemrograman Dart dengan{' '}
          <strong>180 tantangan terstruktur</strong>. Setiap soal kini dilengkapi{' '}
          <strong>Codeline Testing (void main)</strong> siap jalan serta{' '}
          <strong>Panel Bedah Baris Kode & Sintaks</strong> kontekstual agar
          kamu memahami fungsi setiap keyword sekaligus menerapkannya.
        </p>

        <div className="home-stats-grid">
          <div className="stat-glass-box">
            <span className="stat-label">Total Soal Lulus</span>
            <strong className="stat-value">
              {statsSummary.totalPassed} / {statsSummary.totalProblems}
            </strong>
          </div>
          <div className="stat-glass-box">
            <span className="stat-label">Total Poin Terkumpul</span>
            <strong className="stat-value">
              {statsSummary.totalPoints} / {statsSummary.maxPossiblePoints}
            </strong>
          </div>
          <div className="stat-glass-box">
            <span className="stat-label">Fitur Unggulan</span>
            <strong className="stat-value accent-text">
              Auto void main() + Kamus Kode
            </strong>
          </div>
        </div>
      </header>

      {(warning || notice) && (
        <div className="home-alert-banner" role="status">
          <span>{warning ?? notice}</span>
          <button
            type="button"
            className="latih-notice-close"
            onClick={() => setNotice(null)}
          >
            Tutup
          </button>
        </div>
      )}

      {/* Level Selector Tabs */}
      <nav aria-label="Level Kesulitan" className="latih-levels">
        {LEVELS.map((lvl) => {
          const prog = getLevelProgress(lvl);
          const isActive = lvl === level;
          return (
            <button
              key={lvl}
              type="button"
              aria-pressed={isActive}
              className={`level-tab-btn level-${lvl} ${isActive ? 'active' : ''}`}
              onClick={() => {
                setLevel(lvl);
                setFilter((f) => ({ ...f, topic: 'semua' }));
                setConfirmClear(false);
              }}
            >
              <span className="level-tab-name">{LEVEL_LABELS[lvl]}</span>
              <span className="level-tab-count">
                {prog.selesai}/{prog.total} Lulus
              </span>
            </button>
          );
        })}
      </nav>

      {/* Filters Toolbar */}
      <div className="latih-filters">
        <label className="filter-item">
          <span>Status</span>
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter({
                ...filter,
                status: e.target.value as 'semua' | ProblemStatus,
              })
            }
          >
            <option value="semua">Semua Status</option>
            <option value="belum">Belum Dikerjakan</option>
            <option value="dicoba">Sedang Dicoba</option>
            <option value="lulus">Sudah Lulus</option>
          </select>
        </label>

        <label className="filter-item">
          <span>Topik</span>
          <select
            value={filter.topic}
            onChange={(e) => setFilter({ ...filter, topic: e.target.value })}
          >
            <option value="semua">Semua Topik ({topicsInLevel.length})</option>
            {topicsInLevel.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-item search-item">
          <Search size={15} className="search-icon" />
          <input
            type="search"
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
            placeholder="Cari judul, ID (mis. D1-01), atau topik..."
          />
        </label>

        <button
          type="button"
          className="latih-btn random-btn"
          onClick={handleRandomUnfinished}
        >
          <Shuffle size={15} />
          <span>Soal Acak</span>
        </button>
      </div>

      {/* Problem Table */}
      <div className="latih-table-wrap">
        <table>
          <caption className="latih-sr-only">Daftar Soal Latihan Dart</caption>
          <thead>
            <tr>
              <th scope="col">Kode</th>
              <th scope="col">Judul Soal & Fitur Belajar</th>
              <th scope="col">Topik Bahasan</th>
              <th scope="col">Status</th>
              <th scope="col">Poin</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem) => {
              const prog = state.progress[problem.id];
              const status: ProblemStatus = prog?.status ?? 'belum';
              const maxPts = getMaxPoints(problem);
              return (
                <tr key={problem.id} className="problem-row">
                  <td className="problem-id-cell">
                    <code>{problem.id}</code>
                  </td>
                  <td>
                    <Link
                      to={`/soal/${problem.level}/${problem.id}`}
                      className="problem-link"
                    >
                      {problem.title}
                    </Link>
                    <div className="problem-sub-badges">
                      <span className="sub-feature-tag">
                        <Terminal size={11} /> void main()
                      </span>
                      <span className="sub-feature-tag">
                        <BookOpen size={11} />{' '}
                        {problem.codelineExplanations.length} Bedah Sintaks
                      </span>
                    </div>
                  </td>
                  <td>
                    <ul className="latih-topics">
                      {problem.topics.map((t) => (
                        <li key={t}>
                          <span className="latih-chip">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <span className={`status-pill latih-status-${status}`}>
                      {status === 'lulus' && <CheckCircle2 size={13} />}
                      {status === 'dicoba' && <Clock size={13} />}
                      {status === 'belum' && <CircleDot size={13} />}
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="points-cell">
                    <strong>{prog?.bestPoints ?? 0}</strong>{' '}
                    <span className="points-max">/ {maxPts}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredProblems.length === 0 && (
        <div className="latih-empty">
          <p>
            Tidak ada soal yang cocok dengan filter pencarian saat ini pada
            kategori {LEVEL_LABELS[level]}.
          </p>
          <button
            type="button"
            className="latih-btn"
            onClick={() =>
              setFilter({ status: 'semua', topic: 'semua', query: '' })
            }
          >
            Atur Ulang Filter
          </button>
        </div>
      )}

      {/* Progress Management Section */}
      <section aria-label="Kelola Progres" className="progress-manage-card">
        <h2>Kelola & Cadangkan Progres Belajar</h2>
        <div
          className={`latih-dropzone ${dragActive ? 'latih-dropzone-active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleImportFile(file);
          }}
        >
          <p className="latih-dropzone-hint">
            Seret berkas cadangan <code>.json</code> ke area ini untuk
            memulihkan progres & kode jawabanmu, atau gunakan tombol di bawah.
          </p>
          <div className="latih-manage">
            <button type="button" className="latih-btn" onClick={handleExport}>
              <Download size={15} /> Ekspor Progres + Kode (JSON)
            </button>
            <button
              type="button"
              className="latih-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} /> Impor dari JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleImportFile(file);
              }}
            />
          </div>

          <div className="latih-danger-zone">
            <button
              type="button"
              className={`latih-btn ${confirmClear ? 'latih-btn-danger-armed' : ''}`}
              onClick={handleClearProgress}
            >
              <Trash2 size={14} />
              {confirmClear
                ? 'Klik sekali lagi untuk menghapus semua progres'
                : 'Reset Semua Progres'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

