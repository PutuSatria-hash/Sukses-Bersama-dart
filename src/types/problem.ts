export type Level = 'easy' | 'medium' | 'hard';

export interface ProblemTestMeta {
  name: string;
  kind: 'wajib' | 'saran';
  points: number;
}

export interface RawProblem {
  level: Level;
  id: string;
  title: string;
  order: number;
  topics: string[];
  fileName: string;
  timeoutMs: number;
  tests: ProblemTestMeta[];
  brief: string;
  starter: string;
  test: string;
}

export interface CodelineExplanation {
  token: string;
  category: 'Testing' | 'Variabel' | 'Tipe Data' | 'Method & Properti' | 'Alur Kontrol' | 'OOP & Fungsi' | 'Async & Error';
  summary: string;
  detail: string;
  exampleCode: string;
  memoryTip: string;
}

export interface MainGuideStep {
  stepNumber: number;
  title: string;
  explanation: string;
  codeSnippet: string;
}

export interface EnhancedProblem extends RawProblem {
  starterWithMain: string;
  mainTestBlock: string;
  signatureSummary: string;
  mainGuideSteps: MainGuideStep[];
  codelineExplanations: CodelineExplanation[];
}

