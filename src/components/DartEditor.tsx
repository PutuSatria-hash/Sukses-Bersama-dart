import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { linter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { java } from '@codemirror/lang-java';
import { tags } from '@lezer/highlight';
import type { AnalyzeIssue, CompileDiagnostic } from '../runner/dartServices';

const dartHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--syn-keyword)', fontWeight: '600' },
  { tag: [tags.typeName, tags.className], color: 'var(--syn-type)' },
  {
    tag: [tags.function(tags.variableName), tags.propertyName],
    color: 'var(--syn-fn)',
  },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--syn-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--syn-number)' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--syn-comment)',
    fontStyle: 'italic',
  },
  { tag: tags.operator, color: 'var(--syn-operator)' },
]);

const editorCursorTheme = EditorView.theme({
  '&': {
    color: 'var(--editor-fg)',
    backgroundColor: 'var(--surface-code)',
  },
  '.cm-content': {
    caretColor: 'var(--editor-cursor)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--editor-cursor)',
    borderLeftWidth: '2.2px',
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    {
      backgroundColor: 'var(--editor-selection)',
    },
});

export interface DartEditorProps {
  problemId: string;
  initialCode: string;
  analyzeIssues: AnalyzeIssue[];
  compileErrors: CompileDiagnostic[];
  gotoRequest: { line: number; seq: number } | null;
  externalCode: { code: string; seq: number } | null;
  onChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onFormat: () => void;
}

export const DartEditor: React.FC<DartEditorProps> = ({
  problemId,
  initialCode,
  analyzeIssues,
  compileErrors,
  gotoRequest,
  externalCode,
  onChange,
  onRun,
  onSubmit,
  onFormat,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef({ onChange, onRun, onSubmit, onFormat });

  useEffect(() => {
    callbacksRef.current = { onChange, onRun, onSubmit, onFormat };
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const customShortcuts = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          callbacksRef.current.onRun();
          return true;
        },
      },
      {
        key: 'Mod-Shift-Enter',
        run: () => {
          callbacksRef.current.onSubmit();
          return true;
        },
      },
      {
        key: 'Shift-Alt-f',
        run: () => {
          callbacksRef.current.onFormat();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        java(),
        editorCursorTheme,
        syntaxHighlighting(dartHighlightStyle),
        linter(() => []),
        customShortcuts,
        keymap.of([
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            callbacksRef.current.onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent,
    });
    viewRef.current = view;

    return () => {
      viewRef.current = null;
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  // Apply diagnostics from analyzeIssues and compileErrors
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const doc = view.state.doc;
    const diags: Diagnostic[] = [];

    for (const err of compileErrors) {
      if (err.line === null || err.line < 1 || err.line > doc.lines) continue;
      const lineObj = doc.line(err.line);
      diags.push({
        from: lineObj.from,
        to: lineObj.to,
        severity: 'error',
        message: err.message,
      });
    }

    for (const issue of analyzeIssues) {
      if (issue.line < 1 || issue.line > doc.lines) continue;
      const lineObj = doc.line(issue.line);
      const sev =
        issue.kind === 'error'
          ? 'error'
          : issue.kind === 'warning'
            ? 'warning'
            : 'info';
      diags.push({
        from: lineObj.from,
        to: lineObj.to,
        severity: sev,
        message: issue.message,
      });
    }

    view.dispatch(setDiagnostics(view.state, diags));
  }, [analyzeIssues, compileErrors]);

  // Handle gotoLine
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !gotoRequest) return;
    const doc = view.state.doc;
    const safeLine = Math.max(1, Math.min(doc.lines, gotoRequest.line));
    const lineObj = doc.line(safeLine);
    view.dispatch({
      selection: { anchor: lineObj.from },
      scrollIntoView: true,
    });
    view.focus();
  }, [gotoRequest]);

  // Handle external code replacement
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !externalCode) return;
    const currentText = view.state.doc.toString();
    if (currentText !== externalCode.code) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: externalCode.code,
        },
      });
    }
  }, [externalCode]);

  return (
    <div
      ref={containerRef}
      className="latih-editor"
      role="textbox"
      aria-label="Editor kode Dart"
      aria-multiline="true"
    />
  );
};

