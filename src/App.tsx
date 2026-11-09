import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ProblemPage } from './pages/ProblemPage';
import { fetchDartVersion } from './runner/dartServices';

const AppFooter: React.FC = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDartVersion().then((v) => {
      if (!cancelled) setVersion(v.dartVersion);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="latih-footer">
      <span>Sukses Bersama Dart — Edisi Interaktif</span>
      {version && <span>• Engine Kompilator Dart {version}</span>}
    </footer>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/soal/:level/:id" element={<ProblemPage />} />
      </Routes>
      <AppFooter />
    </BrowserRouter>
  );
};

