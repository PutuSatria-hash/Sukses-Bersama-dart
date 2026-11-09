import type {
  RawProblem,
  EnhancedProblem,
  CodelineExplanation,
  MainGuideStep,
} from '../types/problem';

function splitTopLevelArgs(str: string): string[] {
  const args: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === "'" || ch === '"') {
      const q = ch;
      current += ch;
      i++;
      while (i < str.length) {
        if (str[i] === '\\') {
          current += str.slice(i, i + 2);
          i += 2;
          continue;
        }
        current += str[i];
        if (str[i] === q) break;
        i++;
      }
      i++;
      continue;
    }
    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket--;
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;

    if (
      ch === ',' &&
      depthParen === 0 &&
      depthBracket === 0 &&
      depthBrace === 0
    ) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
    i++;
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function formatExpectedMatcher(matcher: string): string {
  let m = matcher.trim();
  if (m.startsWith('equals(') && m.endsWith(')')) {
    m = m.slice(7, -1).trim();
  }
  if (m === 'isTrue') return 'true';
  if (m === 'isFalse') return 'false';
  if (m === 'isEmpty') return '[] (kosong)';
  if (m === 'isNotEmpty') return 'tidak kosong';
  if (m === 'isNull') return 'null';
  if (m === 'isNotNull') return 'bukan null';
  if (m.startsWith('closeTo(') && m.endsWith(')')) {
    const inner = splitTopLevelArgs(m.slice(8, -1));
    return `~${inner[0]}`;
  }
  return m
    .replace(/\s+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\$/g, '\\$');
}

interface ExtractedTestBlock {
  testName: string;
  isAsync: boolean;
  body: string;
}

function extractTestBlocks(testSrc: string): {
  helpers: string;
  blocks: ExtractedTestBlock[];
} {
  const mainIdx = testSrc.indexOf('void main()');
  if (mainIdx < 0) return { helpers: '', blocks: [] };
  let helpers = testSrc
    .slice(0, mainIdx)
    .split('\n')
    .filter((l) => !l.trim().startsWith('import ') && l.trim() !== '')
    .join('\n')
    .trim();
  helpers = helpers.replace(/void _cekSah[\s\S]*$/, '').trim();
  const afterMain = testSrc.slice(mainIdx);
  const blocks: ExtractedTestBlock[] = [];
  const regex = /test\(\s*(['"`])([\s\S]*?)\1\s*,\s*\(\s*\)\s*(async\s*)?\{/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(afterMain)) !== null) {
    const testName = match[2];
    const isAsync = Boolean(match[3]);
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < afterMain.length && depth > 0) {
      const ch = afterMain[i];
      if (ch === "'" || ch === '"') {
        const q = ch;
        i++;
        while (i < afterMain.length) {
          if (afterMain[i] === '\\') {
            i += 2;
            continue;
          }
          if (afterMain[i] === q) break;
          i++;
        }
      } else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }
    blocks.push({
      testName,
      isAsync,
      body: afterMain.slice(bodyStart, i).trim(),
    });
  }
  return { helpers, blocks };
}

function splitStatements(body: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === "'" || ch === '"') {
      const q = ch;
      current += ch;
      i++;
      while (i < body.length) {
        if (body[i] === '\\') {
          current += body.slice(i, i + 2);
          i += 2;
          continue;
        }
        current += body[i];
        if (body[i] === q) break;
        i++;
      }
      i++;
      continue;
    }
    if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;
    else if (ch === '[') depthBracket++;
    else if (ch === ']') depthBracket--;
    else if (ch === '{') depthBrace++;
    else if (ch === '}') depthBrace--;

    if (
      ch === ';' &&
      depthParen === 0 &&
      depthBracket === 0 &&
      depthBrace === 0
    ) {
      if (current.trim()) stmts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
    i++;
  }
  if (current.trim()) stmts.push(current.trim());
  return stmts;
}

export function buildMainTestBlock(problem: RawProblem): {
  mainCode: string;
  firstSampleCall: string;
  firstExpectedText: string;
  isAsyncMain: boolean;
} {
  const { helpers, blocks } = extractTestBlocks(problem.test);
  const simpleBlocks = blocks.filter((b) => {
    const stmts = splitStatements(b.body);
    return !stmts.some((s) => {
      const noComments = s
        .split('\n')
        .filter((l) => !l.trim().startsWith('//'))
        .join('\n')
        .trim();
      return (
        !noComments.match(/^(await\s+)?expect\s*\(/) &&
        noComments.includes('expect(')
      );
    });
  });

  const selectedBlocks = (
    simpleBlocks.length >= 2 ? simpleBlocks : blocks
  ).slice(0, 2);
  const isAsync = selectedBlocks.some((b) => b.isAsync);
  const lines: string[] = [];
  lines.push(
    '// ========================================================================='
  );
  lines.push(
    `// CODELINE TESTING (void main) — Soal ${problem.id}: ${problem.title}`
  );
  lines.push(
    '// Klik tombol "Jalankan" (Ctrl+Enter) untuk menguji kodemu secara langsung!'
  );
  lines.push(
    '// Saat klik "Nilai", blok main() ini otomatis aman & tidak akan bentrok.'
  );
  lines.push(
    '// ========================================================================='
  );
  lines.push(isAsync ? 'Future<void> main() async {' : 'void main() {');

  if (helpers) {
    lines.push('  // Fungsi bantu untuk pengujian lokal:');
    for (const hl of helpers.split('\n')) {
      lines.push('  ' + hl);
    }
    lines.push('');
  }

  let checkCounter = 1;
  let firstSampleCall = '';
  let firstExpectedText = '';

  selectedBlocks.forEach((blk, idx) => {
    if (idx > 0) lines.push('');
    lines.push(`  // Kasus Uji ${idx + 1}: ${blk.testName}`);
    const useSubScope = selectedBlocks.length > 1;
    const indent = useSubScope ? '    ' : '  ';
    if (useSubScope) lines.push('  {');
    const stmts = splitStatements(blk.body);
    for (const stmt of stmts) {
      const rawLines = stmt.trim().split('\n');
      while (rawLines.length > 0 && rawLines[0].trim().startsWith('//')) {
        lines.push(`${indent}${rawLines.shift()!.trim()}`);
      }
      const cleanStmt = rawLines.join('\n').trim();
      if (!cleanStmt) continue;

      const expectMatch = cleanStmt.match(/^(await\s+)?expect\s*\(([\s\S]*)\)$/);
      if (expectMatch) {
        const isAwaitExpect = Boolean(expectMatch[1]);
        const args = splitTopLevelArgs(expectMatch[2]);
        if (args.length >= 2) {
          const actual = args[0].trim();
          const matcher = args[1].trim();
          if (matcher.startsWith('throws') && actual.startsWith('()')) {
            const innerCall = actual.replace(/^\(\s*\)\s*=>\s*/, '').trim();
            if (!firstSampleCall) {
              firstSampleCall = innerCall;
              firstExpectedText = 'Melempar Exception/Error';
            }
            lines.push(`${indent}try {`);
            lines.push(`${indent}  ${innerCall};`);
            lines.push(
              `${indent}  print('Uji ${checkCounter++}: Gagal menangkap error');`
            );
            lines.push(`${indent}} catch (e) {`);
            lines.push(
              `${indent}  print('Uji ${checkCounter++}: Berhasil menangkap error -> $e');`
            );
            lines.push(`${indent}}`);
          } else if (
            matcher === 'returnsNormally' &&
            actual.startsWith('()')
          ) {
            const innerCall = actual.replace(/^\(\s*\)\s*=>\s*/, '').trim();
            if (!firstSampleCall) {
              firstSampleCall = innerCall;
              firstExpectedText = 'Selesai normal tanpa error';
            }
            lines.push(`${indent}${innerCall};`);
            lines.push(
              `${indent}print('Uji ${checkCounter++}: Selesai normal (Ekspektasi: tidak error)');`
            );
          } else {
            const expText = formatExpectedMatcher(matcher);
            const varName = `uji${checkCounter}`;
            const awaitPrefix =
              isAwaitExpect && !actual.startsWith('await ') ? 'await ' : '';
            const fullCall = `${awaitPrefix}${actual}`;
            if (!firstSampleCall) {
              firstSampleCall = fullCall;
              firstExpectedText = expText;
            }
            lines.push(`${indent}final ${varName} = ${fullCall};`);
            lines.push(
              `${indent}print('Uji ${checkCounter} -> Hasil: $${varName} | Ekspektasi: ${expText}');`
            );
            checkCounter++;
          }
        }
      } else {
        for (const sl of cleanStmt.split('\n')) {
          lines.push(`${indent}${sl}`);
        }
        if (!cleanStmt.endsWith('}')) {
          lines[lines.length - 1] += ';';
        }
      }
    }
    if (useSubScope) lines.push('  }');
  });

  lines.push('}');
  return {
    mainCode: lines.join('\n'),
    firstSampleCall: firstSampleCall || 'fungsiSoal()',
    firstExpectedText: firstExpectedText || 'hasil yang sesuai',
    isAsyncMain: isAsync,
  };
}

function extractSignatureSummary(starter: string): string {
  const nonCommentLines = starter
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('//'));
  if (nonCommentLines.length === 0) return 'void main()';
  const firstLine = nonCommentLines[0].replace(/\{\s*$/, '').trim();
  return firstLine;
}

function buildMainGuideSteps(
  problem: RawProblem,
  firstSampleCall: string,
  firstExpectedText: string,
  isAsyncMain: boolean
): MainGuideStep[] {
  const sig = extractSignatureSummary(problem.starter);
  const entryHeader = isAsyncMain
    ? 'Future<void> main() async'
    : 'void main()';

  return [
    {
      stepNumber: 1,
      title: `Deklarasikan Entry Point (${entryHeader})`,
      explanation: isAsyncMain
        ? `Karena soal "${problem.title}" bekerja secara asinkron (mengembalikan Future/Stream), fungsi utama pengujian harus ditulis sebagai \`Future<void> main() async { ... }\` agar kita bisa memakai kata kunci \`await\` di dalamnya.`
        : `Setiap program Dart membutuhkan fungsi \`void main() { ... }\` sebagai pintu masuk utama (*entry point*) saat tombol **Jalankan** ditekan. Kata \`void\` berarti fungsi \`main\` tidak mengembalikan nilai akhir, melainkan langsung mengeksekusi perintah di dalamnya.`,
      codeSnippet: `${entryHeader} {\n  // Tulis kode pengujian di dalam kurung kurawal ini\n}`,
    },
    {
      stepNumber: 2,
      title: 'Panggil Fungsi / Class Soal & Tampung di Variabel `final`',
      explanation: `Panggil kontrak soal (\`${sig}\`) dengan nilai masukan (*input*) dari tabel contoh soal, lalu simpan hasilnya ke dalam variabel menggunakan \`final\` (misalnya \`final uji1 = ...\`).`,
      codeSnippet: `final uji1 = ${firstSampleCall};`,
    },
    {
      stepNumber: 3,
      title: 'Cetak Hasil & Bandingkan Ekspektasi dengan `print()`',
      explanation: `Gunakan fungsi \`print()\` dan *string interpolation* (\`$uji1\`) untuk menampilkan nilai yang dihasilkan kodemu ke panel **Output Program**, bersandingan dengan jawaban yang seharusnya (\`${firstExpectedText}\`).`,
      codeSnippet: `print('Uji 1 -> Hasil: $uji1 | Ekspektasi: ${firstExpectedText}');`,
    },
    {
      stepNumber: 4,
      title: 'Tambahkan Kasus Tepi (Edge Cases) Sebelum Menekan "Nilai"',
      explanation: `Agar mendapat poin maksimal (Wajib + Saran), tambahkan beberapa baris pengujian di dalam \`void main()\` untuk menguji kondisi batas seperti masukan kosong, angka 0, nilai negatif, atau spasi berlebih.`,
      codeSnippet: `${entryHeader} {\n  final uji1 = ${firstSampleCall};\n  print('Uji 1 -> Hasil: $uji1 | Ekspektasi: ${firstExpectedText}');\n  // Tambahkan uji2, uji3 untuk kasus tepi di bawahnya!\n}`,
    },
  ];
}

export function buildCodelineExplanations(
  problem: RawProblem,
  firstSampleCall: string,
  isAsyncMain: boolean
): CodelineExplanation[] {
  const combinedText = `${problem.starter}\n${problem.brief}\n${problem.test}`;
  const topics = new Set(problem.topics.map((t) => t.toLowerCase()));
  const items: CodelineExplanation[] = [];

  // 1. Always include void main() / Future<void> main() async
  items.push({
    token: isAsyncMain ? 'Future<void> main() async' : 'void main()',
    category: 'Testing',
    summary: 'Fungsi utama (Entry Point) untuk menjalankan & mengetes kode',
    detail: isAsyncMain
      ? 'Menjadi titik awal eksekusi program saat tombol "Jalankan" ditekan. Penambahan `async` mengizinkan kita menunggu hasil `Future` menggunakan `await` di dalam blok testing.'
      : 'Menjadi titik awal eksekusi program Dart saat tombol "Jalankan" ditekan. Kata `void` menandakan fungsi ini tidak mengembalikan nilai, dan `main()` adalah nama wajib yang dicari kompilator Dart.',
    exampleCode: isAsyncMain
      ? `Future<void> main() async {\n  final uji1 = ${firstSampleCall};\n  print(uji1);\n}`
      : `void main() {\n  final uji1 = ${firstSampleCall};\n  print(uji1);\n}`,
    memoryTip:
      'Ingat: Tanpa main(), program tidak tahu harus mulai jalan dari mana saat tombol Jalankan diklik.',
  });

  // 2. Always include print()
  items.push({
    token: 'print(...)',
    category: 'Testing',
    summary: 'Menampilkan hasil eksekusi kode ke konsol Output Program',
    detail:
      'Mencetak teks, angka, boolean, List, atau Map ke layar konsol di bawah editor. Sangat berguna di dalam `void main()` untuk memeriksa apakah keluaran fungsi sudah sesuai dengan tabel contoh soal.',
    exampleCode: `print('Hasil uji: \${${firstSampleCall}}');`,
    memoryTip:
      'Gunakan print() di dalam void main() untuk mengintip isi variabel sebelum menekan tombol Nilai.',
  });

  // 3. Always include final vs var (specifically requested by Boss!)
  items.push({
    token: 'final',
    category: 'Variabel',
    summary: 'Variabel yang nilainya hanya diisi 1 kali (Immutable Reference)',
    detail:
      'Gunakan `final` untuk mendeklarasikan variabel yang nilainya tidak akan diganti lagi setelah diisi pertama kali. Di Dart, memakai `final` adalah praktik terbaik untuk mencegah perubahan nilai yang tidak sengaja.',
    exampleCode: `final hasilBersih = ${firstSampleCall};`,
    memoryTip:
      'Ingat: Pakai `final` sebagai pilihan utama setiap kali membuat variabel baru yang tidak perlu diubah ulang.',
  });

  items.push({
    token: 'var',
    category: 'Variabel',
    summary: 'Variabel yang nilainya BISA diubah berkali-kali (Mutable)',
    detail:
      'Dart otomatis menebak tipe datanya (*type inference*) dari nilai awal yang diberikan, namun berbeda dengan `final`, isi variabel `var` boleh diubah lagi (misalnya untuk penghitung di dalam perulangan `for` atau penampung total sementara).',
    exampleCode: `var penghitung = 0;\npenghitung = penghitung + 1; // Boleh diubah karena memakai var`,
    memoryTip:
      'Ingat: `final` = dikunci sekali isi; `var` = boleh diganti-ganti nilainya (cocok untuk counter/loop).',
  });

  // 4. return
  if (problem.starter.includes('return') || !problem.starter.includes('class ')) {
    items.push({
      token: 'return',
      category: 'Alur Kontrol',
      summary: 'Menghentikan fungsi dan mengirimkan nilai hasil ke pemanggil',
      detail:
        'Setiap fungsi yang memiliki tipe kembalian selain `void` (seperti `String`, `int`, `bool`, `List`) wajib mengembalikan nilai yang tipenya cocok menggunakan `return`. Begitu baris `return` dijalankan, baris kode di bawahnya di dalam fungsi yang sama tidak akan dieksekusi lagi.',
      exampleCode: `return hasilAkhir;`,
      memoryTip:
        'Ingat: `return` adalah pintu keluar fungsi sambil membawa jawaban akhir.',
    });
  }

  // 5. String & String methods
  if (
    combinedText.includes('String') ||
    topics.has('string') ||
    topics.has('interpolasi')
  ) {
    items.push({
      token: 'String & $interpolasi',
      category: 'Tipe Data',
      summary: 'Tipe data teks & penyisipan variabel langsung ke dalam teks',
      detail:
        'Di Dart, teks ditulis dengan kutip satu `\'...\'` atau kutip dua `"..."`. Untuk menyisipkan variabel ke dalam teks, gunakan `$namaVariabel`, atau `${ekspresi}` jika memanggil properti/method.',
      exampleCode: `final nama = 'Ayu';\nfinal kalimat = 'Halo, $nama! Panjang: \${nama.length}';`,
      memoryTip:
        'Ingat: Cukup `$nama` untuk variabel tunggal, dan `${nama.trim()}` pakai kurung kurawal jika ada titik/operasi.',
    });
  }

  if (
    combinedText.includes('trim') ||
    topics.has('trim') ||
    problem.id === 'D1-01'
  ) {
    items.push({
      token: '.trim()',
      category: 'Method & Properti',
      summary: 'Membuang spasi berlebih di ujung kiri dan kanan teks',
      detail:
        'Method bawaan `String` yang menghasilkan teks baru tanpa karakter spasi, tab, atau baris baru (*whitespace*) di bagian awal maupun akhir kalimat, namun tetap mempertahankan spasi di tengah kata.',
      exampleCode: `final bersih = '   Citra Dewi  '.trim(); // Menghasilkan 'Citra Dewi'`,
      memoryTip:
        'Ingat: `.trim()` = pangkas rapi spasi pinggir sebelum memeriksa apakah teks kosong atau tidak.',
    });
  }

  if (
    combinedText.includes('isEmpty') ||
    combinedText.includes('isNotEmpty') ||
    topics.has('string') ||
    topics.has('list') ||
    topics.has('map')
  ) {
    items.push({
      token: '.isEmpty / .isNotEmpty',
      category: 'Method & Properti',
      summary: 'Mengecek apakah String, List, Set, atau Map kosong (`true`/`false`)',
      detail:
        '`.isEmpty` bernilai `true` jika teks tidak memiliki karakter sama sekali (`\'\'`) atau koleksi memiliki 0 elemen (`[]`). Sebaliknya, `.isNotEmpty` bernilai `true` jika minimal ada 1 karakter/elemen.',
      exampleCode: `if (teks.trim().isEmpty) {\n  return 'Halo, tamu!';\n}`,
      memoryTip:
        'Ingat: Di Dart, lebih rapi menulis `teks.isEmpty` daripada `teks.length == 0`.',
    });
  }

  if (
    combinedText.includes('split') ||
    combinedText.includes('join') ||
    topics.has('split')
  ) {
    items.push({
      token: '.split(...) & .join(...)',
      category: 'Method & Properti',
      summary: 'Memecah String menjadi List kata, dan menggabungkannya kembali',
      detail:
        '`teks.split(pemisah)` memecah teks menjadi `List<String>` berdasarkan pemisah. Kebalikannya, `daftar.join(penghubung)` merangkai seluruh elemen List menjadi satu `String`.',
      exampleCode: `final kata = 'belajar dart seru'.split(' '); // ['belajar', 'dart', 'seru']\nfinal gabung = kata.join('-'); // 'belajar-dart-seru'`,
      memoryTip:
        'Ingat: `split` = potong teks jadi List; `join` = jahit List kembali jadi teks.',
    });
  }

  if (
    combinedText.includes('substring') ||
    topics.has('substring') ||
    topics.has('potong')
  ) {
    items.push({
      token: '.substring(awal, [akhir])',
      category: 'Method & Properti',
      summary: 'Mengambil potongan teks dari indeks `awal` sampai sebelum `akhir`',
      detail:
        'Mengambil sebagian karakter dari `String`. Indeks dimulai dari 0. Parameter `akhir` bersifat eksklusif (karakter pada indeks `akhir` tidak ikut terambil).',
      exampleCode: `final teks = 'Indonesia';\nprint(teks.substring(0, 4)); // 'Indo'`,
      memoryTip:
        'Ingat: `substring(0, n)` selalu menghasilkan tepat `n` karakter pertama.',
    });
  }

  // 6. Numbers & Arithmetic
  if (
    /\bint\b|\bdouble\b|\bnum\b/.test(problem.starter) ||
    topics.has('aritmetika') ||
    topics.has('double') ||
    topics.has('modulo')
  ) {
    items.push({
      token: 'int & double (% dan ~/)',
      category: 'Tipe Data',
      summary: 'Tipe bilangan bulat (`int`), desimal (`double`), modulo (`%`), & bagi bulat (`~/`)',
      detail:
        '`int` menyimpan angka bulat, sedangkan `double` menyimpan angka pecahan/desimal. Operator `%` mengambil sisa pembagian (mis. `7 % 2 == 1`), sedangkan `~/` membagi dan langsung membulatkan ke bawah menjadi `int` (mis. `7 ~/ 2 == 3`).',
      exampleCode: `final sisa = 15 % 4;   // 3\nfinal bulat = 15 ~/ 4; // 3`,
      memoryTip:
        'Ingat: Gunakan `n % 2 == 0` untuk cek bilangan genap, dan `n ~/ 10` untuk membuang digit satuan.',
    });
  }

  // 7. Conditionals
  if (
    topics.has('kondisional') ||
    topics.has('if-else') ||
    combinedText.includes('if (') ||
    problem.level === 'easy'
  ) {
    items.push({
      token: 'if / else & Operator Ternary (? :)',
      category: 'Alur Kontrol',
      summary: 'Percabangan logika untuk mengambil keputusan berdasarkan kondisi boolean',
      detail:
        'Gunakan `if (kondisi) { ... } else { ... }` untuk mengeksekusi blok kode yang berbeda. Untuk kondisi singkat satu baris, gunakan operator ternary `kondisi ? nilaiJikaBenar : nilaiJikaSalah`.',
      exampleCode: `final status = nilai >= 75 ? 'Lulus' : 'Remedial';`,
      memoryTip:
        'Ingat: Urutkan pemeriksaan `if` dari syarat yang paling spesifik/ketat ke yang paling umum.',
    });
  }

  // 8. Loops
  if (
    topics.has('perulangan') ||
    topics.has('perulangan-bersarang') ||
    topics.has('array') ||
    combinedText.includes('for (') ||
    combinedText.includes('while (')
  ) {
    items.push({
      token: 'for / for-in / while',
      category: 'Alur Kontrol',
      summary: 'Perulangan untuk memproses deret angka atau setiap elemen koleksi',
      detail:
        'Gunakan `for (var i = 0; i < n; i++)` jika butuh nomor indeksnya, atau `for (final elemen in daftar)` jika hanya ingin membaca isi elemennya satu per satu, dan `while (kondisi)` jika jumlah putaran belum diketahui pasti.',
      exampleCode: `var total = 0;\nfor (final angka in daftarAngka) {\n  total += angka;\n}`,
      memoryTip:
        'Ingat: `for-in` (`for (final x in list)`) lebih bersih dan bebas risiko salah indeks dibanding `for` klasik.',
    });
  }

  // 9. List & Functional Collection methods
  if (
    problem.starter.includes('List<') ||
    topics.has('list') ||
    topics.has('where') ||
    topics.has('fold') ||
    topics.has('sort')
  ) {
    items.push({
      token: 'List<T> (.where, .map, .fold, .toList)',
      category: 'Method & Properti',
      summary: 'Koleksi berurutan & transformasi data bergaya fungsional',
      detail:
        '`.where((x) => ...)` menyaring elemen yang memenuhi syarat; `.map((x) => ...)` mengubah bentuk tiap elemen; `.fold(awal, (akumulasi, x) => ...)` merangkum seluruh elemen menjadi satu nilai akhir. Jangan lupa akhiri `.where()` atau `.map()` dengan `.toList()` bila fungsi meminta kembalian `List`.',
      exampleCode: `final genapKuadrat = angka\n    .where((n) => n.isEven)\n    .map((n) => n * n)\n    .toList();`,
      memoryTip:
        'Ingat: `where` = saring, `map` = ubah bentuk, `fold` = lebur jadi satu nilai, `toList()` = bungkus kembali jadi List.',
    });
  }

  // 10. Map
  if (
    problem.starter.includes('Map<') ||
    topics.has('map') ||
    topics.has('hash-map') ||
    topics.has('frekuensi')
  ) {
    items.push({
      token: 'Map<K, V> (Pasangan Kunci & Nilai)',
      category: 'Tipe Data',
      summary: 'Struktur data kamus untuk menyimpan dan mencari nilai berdasarkan kunci unik',
      detail:
        'Mengakses `peta[kunci]` akan mengembalikan `null` jika kunci belum ada. Kombinasikan dengan operator `?? 0` untuk menghitung frekuensi kemunculan dengan ringkas: `frekuensi[item] = (frekuensi[item] ?? 0) + 1;`.',
      exampleCode: `final hitung = <String, int>{};\nfor (final kata in daftar) {\n  hitung[kata] = (hitung[kata] ?? 0) + 1;\n}`,
      memoryTip:
        'Ingat: Pola `(map[k] ?? 0) + 1` adalah jurus andalan untuk menghitung frekuensi di Dart.',
    });
  }

  // 11. Set
  if (
    problem.starter.includes('Set<') ||
    topics.has('set') ||
    topics.has('hash-set')
  ) {
    items.push({
      token: 'Set<T> & .toSet()',
      category: 'Tipe Data',
      summary: 'Koleksi elemen unik tanpa duplikat dengan pencarian instan O(1)',
      detail:
        '`Set` otomatis menolak elemen kembar. Memanggil `daftar.toSet().toList()` adalah cara tercepat membuang duplikat dari sebuah `List` sambil menjaga urutan kemunculan pertama.',
      exampleCode: `final unik = [1, 2, 2, 3, 1].toSet().toList(); // [1, 2, 3]`,
      memoryTip:
        'Ingat: Gunakan `Set` saat ingin membuang data kembar atau mengecek keberadaan elemen (`contains`) dengan sangat cepat.',
    });
  }

  // 12. Null safety
  if (
    problem.starter.includes('?') ||
    topics.has('null-safety') ||
    topics.has('operator-??')
  ) {
    items.push({
      token: 'Null Safety (?, ??, ??=, ?.)',
      category: 'Alur Kontrol',
      summary: 'Penanganan nilai kosong (`null`) secara aman tanpa memicu crash',
      detail:
        'Tanda `?` pada tipe (`String?`) berarti variabel boleh bernilai `null`. Operator `a ?? b` mengambil `a` jika tidak `null`, atau memakai nilai cadangan `b` jika `a` bernilai `null`. Operator `?.` memanggil method hanya jika objeknya tidak `null`.',
      exampleCode: `String? masukan;\nfinal aman = masukan?.trim() ?? 'Nilai Cadangan';`,
      memoryTip:
        'Ingat: Hindari tanda seru `!` (null assertion); gunakan `??` untuk memberi nilai default yang aman.',
    });
  }

  // 13. Class & OOP
  if (
    problem.starter.includes('class ') ||
    topics.has('class') ||
    topics.has('konstruktor') ||
    topics.has('abstract')
  ) {
    items.push({
      token: 'class, Konstruktor (this.), & get/set',
      category: 'OOP & Fungsi',
      summary: 'Cetakan objek yang membungkus data (properti) dan perilaku (method/getter)',
      detail:
        'Konstruktor `NamaClass(this.properti)` langsung mengisi field objek. Properti terhitung ditulis dengan `Tipe get nama => ...;`, sedangkan validasi perubahan nilai ditulis dengan `set nama(Tipe nilai) { ... }`.',
      exampleCode: `class Mahasiswa {\n  final String nama;\n  final double ipk;\n  const Mahasiswa(this.nama, this.ipk);\n  bool get lulus => ipk >= 2.0;\n}`,
      memoryTip:
        'Ingat: `get` dipakai seperti membaca variabel biasa (`m.lulus`), tanpa tanda kurung `()`.',
    });
  }

  // 14. Async / Future / Stream / Exception
  if (
    isAsyncMain ||
    problem.starter.includes('Future') ||
    problem.starter.includes('Stream') ||
    topics.has('async') ||
    topics.has('stream')
  ) {
    items.push({
      token: 'async, await, Future.wait, & await for',
      category: 'Async & Error',
      summary: 'Menjalankan operasi asinkron tanpa membekukan alur program',
      detail:
        'Gunakan `await` di dalam fungsi `async` untuk menunggu `Future` selesai. Jika ada banyak `Future` yang bisa jalan serentak, gunakan `await Future.wait(daftarFuture)`. Untuk membaca `Stream`, gunakan `await for (final data in aliran)`.',
      exampleCode: `final hasilSerentak = await Future.wait(daftarId.map(ambilData));`,
      memoryTip:
        'Ingat: Jangan `await` satu-satu di dalam loop jika tugasnya bisa dijalankan bareng dengan `Future.wait`.',
    });
  }

  if (
    topics.has('exception') ||
    topics.has('try-catch') ||
    problem.test.includes('throws')
  ) {
    items.push({
      token: 'try / catch & throw ArgumentError',
      category: 'Async & Error',
      summary: 'Melempar dan menangkap error saat masukan tidak valid atau operasi gagal',
      detail:
        'Gunakan `throw ArgumentError(...)` atau `throw FormatException(...)` untuk menolak argumen yang tidak sah. Gunakan blok `try { ... } catch (e) { ... }` untuk menangkap error agar program tidak berhenti mendadak.',
      exampleCode: `if (nilai < 0) {\n  throw ArgumentError('Nilai tidak boleh negatif');\n}`,
      memoryTip:
        'Ingat: `throw` = lempar sinyal kesalahan; `try-catch` = tangkap kesalahan agar program tetap aman.',
    });
  }

  return items;
}

export function enhanceProblem(raw: RawProblem): EnhancedProblem {
  const { mainCode, firstSampleCall, firstExpectedText, isAsyncMain } =
    buildMainTestBlock(raw);

  const cleanStarter = raw.starter.trimEnd();
  const starterWithMain = `${cleanStarter}\n\n${mainCode}\n`;

  const updatedBrief = raw.brief.replace(
    /- Jangan menulis fungsi main\./g,
    '- **Fitur Baru**: Fungsi `void main()` sudah disediakan di bawah editor untuk menguji kodemu secara langsung menggunakan tombol **Jalankan** (dan otomatis aman saat menekan **Nilai**).'
  );

  return {
    ...raw,
    brief: updatedBrief,
    starterWithMain,
    mainTestBlock: mainCode,
    signatureSummary: extractSignatureSummary(raw.starter),
    mainGuideSteps: buildMainGuideSteps(
      raw,
      firstSampleCall,
      firstExpectedText,
      isAsyncMain
    ),
    codelineExplanations: buildCodelineExplanations(
      raw,
      firstSampleCall,
      isAsyncMain
    ),
  };
}

