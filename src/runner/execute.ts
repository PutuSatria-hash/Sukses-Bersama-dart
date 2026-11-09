import { compileDDC, DART_SERVICES_URL } from './dartServices';
import { combineForSubmit, hasMainFunction } from './combine';

export interface TestCaseResult {
  name: string;
  status: 'pass' | 'fail' | 'error' | 'timeout';
  message: string;
  reason: string;
  durationMs: number;
}

export interface RunExecutionResult {
  mode: 'run';
  stdout: string[];
  jsError: string | null;
  timedOut: boolean;
  usedAutoMain: boolean;
}

export interface SubmitExecutionResult {
  mode: 'submit';
  results: TestCaseResult[];
  stdout: string[];
  summary: { passed: number; failed: number } | null;
  jsError: string | null;
  timedOut: boolean;
  incompleteReason: string | null;
}

const FRAME_SRC = '/runner/frame.html';
const SDK_LOADED_KEY = 'latih-sdk-loaded-v1';

function buildDdcBootstrapScript(servicesUrl: string, compiledJs: string): string {
  const artifactsUrl = `${servicesUrl}artifacts/`;
  return `require.config({baseUrl:${JSON.stringify(artifactsUrl)},waitSeconds:60,onNodeCreated:function(node){node.setAttribute('crossorigin','anonymous');}});{let __ddcInitCode=function(){${compiledJs}};require(["ddc_module_loader"],function(){require(["dart_sdk_new"],function(){__ddcInitCode();try{dartDevEmbedder.runMain('package:dartpad_sample/bootstrap.dart',{});}finally{parent.postMessage({sender:"latih-frame",type:"settled"},"*");}});});}`;
}

function executeInSandboxFrame(
  container: HTMLElement,
  params: {
    javaScript: string;
    servicesUrl: string;
    timeoutMs?: number;
  }
): Promise<{ stdout: string[]; jsError: string | null; timedOut: boolean }> {
  return new Promise((resolve) => {
    const isFirstLoad =
      sessionStorage.getItem(SDK_LOADED_KEY + params.servicesUrl) === null;
    const limitMs = params.timeoutMs ?? (isFirstLoad ? 30000 : 12000);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.cssText =
      'position:absolute;width:0;height:0;border:0;visibility:hidden;';
    iframe.src = FRAME_SRC;

    const stdout: string[] = [];
    let jsError: string | null = null;
    let finished = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let frameReady = false;

    function finish(res: {
      stdout: string[];
      jsError: string | null;
      timedOut: boolean;
    }) {
      if (finished) return;
      finished = true;
      clearTimeout(hardTimer);
      clearTimeout(settleTimer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      if (!res.timedOut) {
        try {
          sessionStorage.setItem(SDK_LOADED_KEY + params.servicesUrl, '1');
        } catch {}
      }
      resolve(res);
    }

    function scheduleSettle() {
      if (!frameReady) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        finish({ stdout, jsError, timedOut: false });
      }, 450);
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (typeof data !== 'object' || !data || data.sender !== 'latih-frame') {
        return;
      }
      if (data.type === 'ready') {
        frameReady = true;
        iframe.contentWindow?.postMessage(
          {
            command: 'execute',
            js: buildDdcBootstrapScript(params.servicesUrl, params.javaScript),
          },
          '*'
        );
      } else if (data.type === 'stdout') {
        stdout.push(String(data.message ?? ''));
        scheduleSettle();
      } else if (data.type === 'settled') {
        scheduleSettle();
      } else if (data.type === 'jserr') {
        const msg = String(data.message ?? 'Kesalahan JavaScript.');
        jsError = jsError === null ? msg : `${jsError}\n${msg}`;
        finish({ stdout, jsError, timedOut: false });
      }
    }

    const hardTimer = setTimeout(() => {
      finish({ stdout, jsError, timedOut: true });
    }, limitMs);

    window.addEventListener('message', onMessage);
    container.appendChild(iframe);
  });
}

function parseLatihStdout(lines: string[]): {
  results: TestCaseResult[];
  stdout: string[];
  summary: { passed: number; failed: number } | null;
} {
  const results: TestCaseResult[] = [];
  const stdout: string[] = [];
  let summary: { passed: number; failed: number } | null = null;

  for (const line of lines) {
    if (!line.startsWith('@@LATIH@@')) {
      stdout.push(line);
      continue;
    }
    try {
      const parsed = JSON.parse(line.slice(9)) as Record<string, unknown>;
      if (parsed.type === 'result') {
        const rawStatus = parsed.status;
        const status =
          rawStatus === 'pass' ||
          rawStatus === 'fail' ||
          rawStatus === 'error' ||
          rawStatus === 'timeout'
            ? rawStatus
            : 'error';
        results.push({
          name: typeof parsed.name === 'string' ? parsed.name : '',
          status,
          message: typeof parsed.message === 'string' ? parsed.message : '',
          reason: typeof parsed.reason === 'string' ? parsed.reason : '',
          durationMs:
            typeof parsed.durationMs === 'number' ? parsed.durationMs : 0,
        });
      } else if (parsed.type === 'done') {
        summary = {
          passed: typeof parsed.passed === 'number' ? parsed.passed : 0,
          failed: typeof parsed.failed === 'number' ? parsed.failed : 0,
        };
      }
    } catch {
      stdout.push(line);
    }
  }

  return { results, stdout, summary };
}

export async function runUserCode(
  container: HTMLElement,
  userCode: string,
  fallbackMainBlock: string,
  timeoutMs?: number
): Promise<RunExecutionResult> {
  const hasMain = hasMainFunction(userCode);
  const effectiveSource = hasMain
    ? userCode
    : `${userCode.trimEnd()}\n\n${fallbackMainBlock}\n`;

  const javaScript = await compileDDC(effectiveSource, 1, { timeoutMs });
  const execRes = await executeInSandboxFrame(container, {
    javaScript,
    servicesUrl: DART_SERVICES_URL,
    timeoutMs,
  });

  return {
    mode: 'run',
    stdout: execRes.stdout,
    jsError: execRes.jsError,
    timedOut: execRes.timedOut,
    usedAutoMain: !hasMain,
  };
}

export async function submitUserCode(
  container: HTMLElement,
  params: {
    userCode: string;
    testCode: string;
    harness: string;
    timeoutMs?: number;
  }
): Promise<SubmitExecutionResult> {
  const { source, userLineOffset } = combineForSubmit({
    userCode: params.userCode,
    testCode: params.testCode,
    harness: params.harness,
  });

  const javaScript = await compileDDC(source, userLineOffset, {
    timeoutMs: params.timeoutMs,
  });
  const execRes = await executeInSandboxFrame(container, {
    javaScript,
    servicesUrl: DART_SERVICES_URL,
    timeoutMs: params.timeoutMs,
  });

  const parsed = parseLatihStdout(execRes.stdout);
  let incompleteReason: string | null = null;
  if (parsed.summary === null) {
    incompleteReason = execRes.timedOut
      ? 'Waktu habis: program tidak selesai dalam batas waktu. Periksa apakah ada perulangan tak berujung (infinite loop).'
      : execRes.jsError === null
        ? 'Program selesai tanpa hasil test.'
        : `Program berhenti karena error sebelum semua test selesai: ${execRes.jsError}`;
  }

  return {
    mode: 'submit',
    results: parsed.results,
    stdout: parsed.stdout,
    summary: parsed.summary,
    jsError: execRes.jsError,
    timedOut: execRes.timedOut,
    incompleteReason,
  };
}

