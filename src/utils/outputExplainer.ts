import type { EnhancedProblem } from '../types/problem';
import type { RunExecutionResult, SubmitExecutionResult } from '../runner/execute';

export interface OutputLineExplanation {
  rawLine: string;
  testIndex: number | null;
  callExpression: string | null;
  actualValue: string | null;
  expectedValue: string | null;
  status: 'match' | 'mismatch' | 'neutral';
  explanation: string;
}

export interface RunExplanationReport {
  headline: string;
  codeFlowSummary: string;
  detectedConstructs: string[];
  isStarterUnchanged: boolean;
  matchCount: number;
  totalChecks: number;
  nextStepAdvice: string;
  lines: OutputLineExplanation[];
}

function extractUserSolutionPart(fullCode: string): string {
  const bannerIdx = fullCode.indexOf('// CODELINE TESTING');
  if (bannerIdx >= 0) {
    return fullCode.slice(0, bannerIdx).trim();
  }
  const mainMatch = fullCode.match(
    /(^|\n)\s*(Future\s*<\s*void\s*>\s+|Future\s+|void\s+)?main\s*\(\s*\)/
  );
  if (mainMatch && mainMatch.index !== undefined) {
    return fullCode.slice(0, mainMatch.index).trim();
  }
  return fullCode.trim();
}

function extractTestCallsMap(fullCode: string): Map<number, string> {
  const map = new Map<number, string>();
  const regex = /final\s+uji(\d+)\s*=\s*([\s\S]*?);/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fullCode)) !== null) {
    const num = Number(match[1]);
    const expr = match[2].replace(/\s+/g, ' ').trim();
    map.set(num, expr);
  }
  return map;
}

function detectConstructsInSolution(solutionCode: string): string[] {
  const clean = solutionCode
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');

  const found: string[] = [];
  if (/\bfinal\s+\w+/.test(clean)) found.push('final (variabel tetap)');
  if (/\bvar\s+\w+/.test(clean)) found.push('var (variabel dinamis)');
  if (/\.trim\s*\(/.test(clean)) found.push('.trim() (pangkas spasi)');
  if (/\.isEmpty\b/.test(clean)) found.push('.isEmpty (cek kosong)');
  if (/\.isNotEmpty\b/.test(clean)) found.push('.isNotEmpty (cek berisi)');
  if (/\bif\s*\(/.test(clean)) found.push('if / else (percabangan)');
  if (/\bswitch\s*\(/.test(clean)) found.push('switch (pencocokan pola)');
  if (/\bfor\s*\(/.test(clean)) found.push('for (perulangan)');
  if (/\bwhile\s*\(/.test(clean)) found.push('while (perulangan kondisi)');
  if (/\.where\s*\(/.test(clean)) found.push('.where() (penyaringan)');
  if (/\.map\s*\(/.test(clean)) found.push('.map() (transformasi)');
  if (/\.fold\s*\(/.test(clean)) found.push('.fold() (akumulasi)');
  if (/\.split\s*\(/.test(clean)) found.push('.split() (pemecah teks)');
  if (/\.join\s*\(/.test(clean)) found.push('.join() (penggabung teks)');
  if (/\$[a-zA-Z_{]/.test(clean)) found.push('$interpolasi (sisip variabel ke teks)');
  if (/\?\?/.test(clean)) found.push('?? (nilai cadangan null-safety)');
  if (/\bawait\b/.test(clean)) found.push('await (tunggu proses asinkron)');
  if (/Future\.wait/.test(clean)) found.push('Future.wait (eksekusi paralel)');
  if (/\btry\s*\{/.test(clean)) found.push('try / catch (penanganan error)');
  if (/\bthrow\s+/.test(clean)) found.push('throw (lempar exception)');

  return found;
}

function normalizeForCheck(val: string): string {
  return val.replace(/^'|'$/g, '').trim();
}

function checkLineStatus(
  actualRaw: string,
  expectedRaw: string
): 'match' | 'mismatch' | 'neutral' {
  const actual = actualRaw.trim();
  const expected = expectedRaw.trim();
  const cleanExp = normalizeForCheck(expected);

  if (
    actual === expected ||
    actual === cleanExp ||
    (expected.includes('kosong') &&
      (actual === '[]' || actual === '' || actual === '{}'))
  ) {
    return 'match';
  }
  if (expected.startsWith('~') || expected.startsWith('contains(')) {
    const innerContains = expected.match(/^contains\('(.*)'\)$/);
    if (innerContains) {
      return actual.includes(innerContains[1]) ? 'match' : 'mismatch';
    }
    if (expected.startsWith('~')) {
      const targetNum = Number(expected.slice(1));
      const actualNum = Number(actual);
      if (!Number.isNaN(targetNum) && !Number.isNaN(actualNum)) {
        return Math.abs(actualNum - targetNum) <= 0.05 ? 'match' : 'mismatch';
      }
    }
    return 'neutral';
  }
  return 'mismatch';
}

function explainLineResult(params: {
  testIndex: number;
  callExpression: string | null;
  actual: string;
  expected: string;
  status: 'match' | 'mismatch' | 'neutral';
  isStarterUnchanged: boolean;
}): string {
  const {
    testIndex,
    callExpression,
    actual,
    expected,
    status,
    isStarterUnchanged,
  } = params;
  const callText = callExpression ? `\`${callExpression}\`` : `Uji ${testIndex}`;
  const cleanExp = normalizeForCheck(expected);
  const displayActual = actual === '' ? "'' (teks kosong)" : `\`${actual}\``;

  if (status === 'match') {
    return `Berhasil! Saat \`void main()\` memanggil ${callText}, fungsi yang kamu buat mengembalikan nilai ${displayActual} yang sudah sesuai dengan ekspektasi (\`${cleanExp}\`).`;
  }

  if (status === 'neutral') {
    return `Saat \`void main()\` memanggil ${callText}, kodemu menghasilkan ${displayActual}. Bandingkan apakah nilai ini sudah memenuhi target \`${expected}\`.`;
  }

  // Status === 'mismatch' -> Diagnose the exact reason!
  if (isStarterUnchanged) {
    return `Pemanggilan ${callText} menghasilkan ${displayActual} karena fungsi utama di atas \`void main()\` masih mengembalikan nilai bawaan starter (bagian \`// TODO\` belum diisi logika penyelesaian).`;
  }

  if (
    actual === '' ||
    actual === '0' ||
    actual === '[]' ||
    actual === '{}' ||
    actual === '-1' ||
    actual === 'false'
  ) {
    return `Pemanggilan ${callText} masih mengembalikan nilai awal/kosong (${displayActual}), padahal seharusnya \`${cleanExp}\`. Pastikan hasil perhitunganmu dikembalikan di baris \`return\`.`;
  }

  // Check if whitespace/trim difference
  if (
    actual.replace(/\s+/g, '') === cleanExp.replace(/\s+/g, '') &&
    actual !== cleanExp
  ) {
    return `Hampir tepat! Pemanggilan ${callText} menghasilkan ${displayActual}, sedangkan targetnya \`${cleanExp}\`. Ada perbedaan spasi — pastikan kamu sudah memanggil \`.trim()\` atau memeriksa spasi pada teks.`;
  }

  // Check if case difference
  if (actual.toLowerCase() === cleanExp.toLowerCase() && actual !== cleanExp) {
    return `Hampir tepat! Pemanggilan ${callText} menghasilkan ${displayActual}, hanya berbeda huruf besar/kecil dibanding \`${cleanExp}\`. Periksa kembali penulisan kapitalisasi hurufnya.`;
  }

  return `Pemanggilan ${callText} menghasilkan ${displayActual}, belum sesuai dengan ekspektasi \`${cleanExp}\`. Periksa kembali logika pengolahan data di dalam fungsimu untuk masukan ini.`;
}

export function buildRunExplanation(
  problem: EnhancedProblem,
  userCode: string,
  runResult: RunExecutionResult
): RunExplanationReport {
  const solutionPart = extractUserSolutionPart(userCode);
  const starterClean = problem.starter.trim();
  const isStarterUnchanged =
    solutionPart === starterClean ||
    (solutionPart.includes('// TODO') &&
      solutionPart.split('\n').length <= starterClean.split('\n').length + 1);

  const detectedConstructs = detectConstructsInSolution(solutionPart);
  const callsMap = extractTestCallsMap(userCode);

  const lines: OutputLineExplanation[] = [];
  let matchCount = 0;
  let totalChecks = 0;

  for (const rawLine of runResult.stdout) {
    const m = rawLine.match(
      /^Uji\s+(\d+)\s*->\s*Hasil:\s*(.*?)\s*\|\s*Ekspektasi:\s*(.*)$/
    );
    if (m) {
      const testIndex = Number(m[1]);
      const actualValue = m[2].trim();
      const expectedValue = m[3].trim();
      const callExpression = callsMap.get(testIndex) ?? null;
      const status = checkLineStatus(actualValue, expectedValue);
      totalChecks++;
      if (status === 'match') matchCount++;

      lines.push({
        rawLine,
        testIndex,
        callExpression,
        actualValue,
        expectedValue,
        status,
        explanation: explainLineResult({
          testIndex,
          callExpression,
          actual: actualValue,
          expected: expectedValue,
          status,
          isStarterUnchanged,
        }),
      });
    } else {
      lines.push({
        rawLine,
        testIndex: null,
        callExpression: null,
        actualValue: null,
        expectedValue: null,
        status: 'neutral',
        explanation: `Dicetak langsung oleh perintah \`print()\` di dalam \`void main()\`: menampilkan nilai \`${rawLine}\`.`,
      });
    }
  }

  let headline = '';
  let codeFlowSummary = '';
  let nextStepAdvice = '';

  if (runResult.timedOut) {
    headline = 'Eksekusi Terhenti Karena Waktu Habis (Timeout)';
    codeFlowSummary =
      'Program yang kamu jalankan tidak kunjung selesai dalam batas waktu. Hal ini biasanya terjadi karena adanya perulangan `while` atau `for` yang kondisinya tidak pernah berhenti (*infinite loop*).';
    nextStepAdvice =
      'Periksa kondisi berhenti pada perulanganmu dan pastikan variabel penghitung selalu bertambah/berkurang menuju batas akhir.';
  } else if (runResult.jsError !== null) {
    headline = 'Terjadi Error Saat Kode Dijalankan (Runtime Error)';
    codeFlowSummary = `Kode berhasil dikompilasi, tetapi berhenti di tengah jalan karena terjadi pengecualian (*exception*): ${runResult.jsError}`;
    nextStepAdvice =
      'Periksa apakah ada akses indeks di luar batas List, pembagian dengan nol, atau exception yang belum ditangani.';
  } else if (isStarterUnchanged) {
    headline = 'Kode Fungsi Utama Masih Berupa Kerangka Awal (Starter)';
    codeFlowSummary = `Saat tombol Jalankan ditekan, Dart mengeksekusi \`void main()\` yang memanggil \`${problem.signatureSummary}\`. Namun karena bagian \`// TODO\` di dalam fungsimu belum diubah, fungsi langsung mengembalikan nilai kosong/default bawaan starter.`;
    nextStepAdvice = `Ubah bagian \`// TODO\` pada fungsi \`${problem.signatureSummary}\` di atas \`void main()\`, gunakan petunjuk di panel kanan (tab "Bedah Kode"), lalu klik **Jalankan** lagi.`;
  } else {
    const constructText =
      detectedConstructs.length > 0
        ? `menggunakan ${detectedConstructs.join(', ')}`
        : 'memproses parameter masukan secara langsung';

    codeFlowSummary = `Alur eksekusi kodemu: Fungsi \`void main()\` mengirimkan data uji ke \`${problem.signatureSummary}\`. Di dalam fungsi tersebut, kodemu ${constructText}, lalu mengirimkan hasilnya kembali lewat \`return\` untuk dicetak oleh \`print()\` di konsol.`;

    if (totalChecks > 0 && matchCount === totalChecks) {
      headline = `Luar Biasa! Seluruh ${totalChecks} Kasus Uji di void main() Sudah COCOK`;
      nextStepAdvice =
        'Semua pengujian di `void main()` sudah menghasilkan output yang benar. Sekarang tekan tombol **Nilai Jawaban (Ctrl+Shift+Enter)** untuk menguji kodemu terhadap seluruh unit test resmi!';
    } else if (totalChecks > 0 && matchCount > 0) {
      headline = `Sebagian Berhasil (${matchCount} dari ${totalChecks} Uji di void main() Cocok)`;
      nextStepAdvice =
        'Logika dasarmu sudah berjalan untuk sebagian kasus, tetapi masih ada kasus uji yang belum cocok. Baca penjelasan di bawah setiap baris yang bertanda BELUM COCOK untuk memperbaiki syarat khususnya.';
    } else if (totalChecks > 0) {
      headline = `Output Berhasil Dicetak, Namun Hasilnya Belum Sesuai Ekspektasi (0/${totalChecks} Cocok)`;
      nextStepAdvice =
        'Bandingkan nilai `Hasil` dan `Ekspektasi` pada tiap baris di bawah. Perhatikan penjelasan di tiap baris untuk mengetahui mengapa keluaran kodemu masih berbeda.';
    } else {
      headline = 'Eksekusi void main() Selesai';
      nextStepAdvice =
        'Gunakan `print()` di dalam `void main()` untuk memeriksa nilai keluaran fungsimu.';
    }
  }

  return {
    headline,
    codeFlowSummary,
    detectedConstructs,
    isStarterUnchanged,
    matchCount,
    totalChecks,
    nextStepAdvice,
    lines,
  };
}

export function buildSubmitExplanation(
  problem: EnhancedProblem,
  userCode: string,
  submitResult: SubmitExecutionResult
): {
  headline: string;
  codeFlowSummary: string;
  advice: string;
} {
  const solutionPart = extractUserSolutionPart(userCode);
  const detectedConstructs = detectConstructsInSolution(solutionPart);
  const passed =
    submitResult.summary?.passed ??
    submitResult.results.filter((r) => r.status === 'pass').length;
  const total = submitResult.results.length;

  const constructInfo =
    detectedConstructs.length > 0
      ? `Kodemu menggunakan ${detectedConstructs.join(', ')}. `
      : '';

  if (passed === total && total > 0) {
    return {
      headline: `Penilaian Sempurna! Seluruh ${total} Unit Test Lulus`,
      codeFlowSummary: `${constructInfo}Fungsi \`${problem.signatureSummary}\` yang kamu tulis berhasil menangani seluruh skenario pengujian wajib maupun saran perbaikan dengan tepat.`,
      advice:
        'Poin maksimal untuk soal ini telah tersimpan di progresmu. Kamu bisa lanjut ke soal berikutnya!',
    };
  }

  const failedTests = submitResult.results.filter((r) => r.status !== 'pass');
  const firstFail = failedTests[0];
  return {
    headline: `Hasil Penilaian: ${passed} dari ${total} Test Lulus (${failedTests.length} Perlu Diperbaiki)`,
    codeFlowSummary: `${constructInfo}Saat diuji oleh test runner otomatis, kodemu belum lolos pada skenario "${firstFail?.name ?? 'tertentu'}".`,
    advice: firstFail?.reason
      ? `Saran perbaikan utama: ${firstFail.reason}`
      : 'Coba tambahkan kasus masukan yang gagal tersebut ke dalam `void main()`, lalu klik **Jalankan** untuk melacak keluarannya.',
  };
}

