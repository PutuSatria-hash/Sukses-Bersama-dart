const IGNORED_IMPORTS = [
  /^package:test(\/|$)/,
  /^package:soal_[^/]*\//,
  /^package:latih\//,
];

const IMPORT_LINE_REGEX = /^\s*import\s+['"]([^'"]+)['"]\s*([^;]*);\s*$/;

function splitImportsAndBody(lines: string[]): {
  imports: string[];
  body: string[];
} {
  const imports: string[] = [];
  const body: string[] = [];
  let inBody = false;

  for (const line of lines) {
    const match = IMPORT_LINE_REGEX.exec(line);
    if (match !== null && !inBody) {
      const pkg = match[1];
      if (!IGNORED_IMPORTS.some((re) => re.test(pkg))) {
        imports.push(line.trim());
      }
    } else {
      if (line.trim() !== '') {
        inBody = true;
      }
      body.push(line);
    }
  }
  return { imports, body };
}

const MAIN_SIGNATURE_REGEX =
  /(^|[^\w$])(Future\s*<\s*void\s*>\s+|Future\s+|void\s+)?main(\s*\()/;

export function hasMainFunction(code: string): boolean {
  return MAIN_SIGNATURE_REGEX.test(code);
}

/**
 * Rename main() inside userCode to _userMain() on the exact same line
 * so user's void main() testing block NEVER collides with the test runner's
 * entrypoint when pressing "Nilai", while keeping line offsets 100% accurate!
 */
function renameUserMain(lines: string[]): string[] {
  return lines.map((line) => {
    if (line.trim().startsWith('//')) return line;
    return line.replace(MAIN_SIGNATURE_REGEX, '$1$2_userMain$3');
  });
}

function renameTestMain(lines: string[]): string[] {
  let replaced = false;
  return lines.map((line) => {
    if (replaced || line.trim().startsWith('//')) return line;
    const next = line.replace(
      /(^|[^\w$])(void\s+)?main\s*\(\s*\)/,
      '$1void latihTestMain()'
    );
    if (next !== line) replaced = true;
    return next;
  });
}

export function combineForSubmit(params: {
  userCode: string;
  testCode: string;
  harness: string;
}): { source: string; userLineOffset: number } {
  const userPart = splitImportsAndBody(params.userCode.split('\n'));
  const testPart = splitImportsAndBody(params.testCode.split('\n'));
  const harnessPart = splitImportsAndBody(params.harness.split('\n'));

  const seenImports = new Set<string>();
  const mergedImports: string[] = [];
  for (const imp of [
    ...userPart.imports,
    ...testPart.imports,
    ...harnessPart.imports,
  ]) {
    if (!seenImports.has(imp)) {
      seenImports.add(imp);
      mergedImports.push(imp);
    }
  }

  const out: string[] = [];
  for (const imp of mergedImports) out.push(imp);
  if (mergedImports.length > 0) out.push('');

  out.push('// --- kode user ---');
  const userLineOffset = out.length + 1;
  for (const line of renameUserMain(userPart.body)) {
    out.push(line);
  }

  out.push('');
  out.push('// --- test soal ---');
  for (const line of renameTestMain(testPart.body)) {
    out.push(line);
  }

  out.push('');
  out.push('// --- harness latih_test ---');
  for (const line of harnessPart.body) {
    out.push(line);
  }

  out.push('');
  out.push('// --- entrypoint ---');
  out.push('Future<void> main() async {');
  out.push('  latihTestMain();');
  out.push('  await runLatihTests();');
  out.push('}');

  return {
    source: `${out.join('\n')}\n`,
    userLineOffset,
  };
}

