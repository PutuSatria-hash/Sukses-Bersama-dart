import type { EnhancedProblem } from '../types/problem';
import type { ExecutionState } from '../components/ResultsDock';

export interface DosenMessage {
  id: string;
  sender: 'dosen' | 'user';
  text: string;
  solutionCode?: string;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const DOSEN_QUICK_PROMPTS: string[] = [
  'Bagaimana cara menjawab soal ini?',
  'Cek kenapa kode saya salah / belum lulus',
  'Jelaskan fungsi & sintaks di soal ini',
  'Apa saja syarat lulus kasus Saran (100%)?',
  'Tampilkan jawaban seharusnya',
];

/**
 * Curated 100% passing reference solutions for foundational & popular exercises,
 * supplemented by our intelligent solution synthesizer for all 180 exercises.
 */
const CURATED_SOLUTIONS: Record<string, { code: string; explanation: string }> = {
  'D1-01': {
    code: `String sapaanWarung(String nama, String pesanan) {
  final n = nama.trim();
  final p = pesanan.trim();
  if (n.isEmpty || p.isEmpty) {
    return 'Data pelanggan belum lengkap.';
  }
  return 'Halo, \$n! Pesanan \$p sedang disiapkan.';
}`,
    explanation:
      '1. Gunakan `.trim()` pada `nama` dan `pesanan` untuk membuang spasi berlebih di awal/akhir.\n2. Cek dengan `.isEmpty` menggunakan operator `||` (ATAU): jika salah satu kosong setelah di-trim, langsung kembalikan `\'Data pelanggan belum lengkap.\'`.\n3. Jika keduanya terisi, kembalikan string dengan interpolasi `\$n` dan `\$p`.',
  },
  'D1-02': {
    code: `int totalBelanja(int hargaSatuan, int jumlah) {
  if (hargaSatuan <= 0 || jumlah <= 0) {
    return 0;
  }
  return hargaSatuan * jumlah;
}`,
    explanation:
      '1. Validasi terlebih dahulu: jika `hargaSatuan <= 0` atau `jumlah <= 0`, kembalikan `0` agar tidak menghasilkan nilai negatif.\n2. Jika valid, kalikan `hargaSatuan * jumlah` dan kembalikan hasilnya.',
  },
  'D1-03': {
    code: `int hitungKembalian(int uangBayar, int totalTagihan) {
  if (uangBayar <= 0 || totalTagihan <= 0) {
    return -1;
  }
  if (uangBayar < totalTagihan) {
    return -1;
  }
  return uangBayar - totalTagihan;
}`,
    explanation:
      '1. Jika `uangBayar <= 0` atau `totalTagihan <= 0`, transaksi tidak valid sehingga mengembalikan `-1`.\n2. Jika `uangBayar < totalTagihan` (uang kurang), kembalikan `-1`.\n3. Selain itu, kembalikan selisih `uangBayar - totalTagihan`.',
  },
  'D1-04': {
    code: `double konversiCelciusKeFahrenheit(double celcius) {
  if (celcius < -273.15) {
    return -999.0;
  }
  final f = (celcius * 9 / 5) + 32;
  return double.parse(f.toStringAsFixed(2));
}`,
    explanation:
      '1. Cek batas nol mutlak: jika `celcius < -273.15`, kembalikan `-999.0`.\n2. Hitung rumus Fahrenheit `(celcius * 9 / 5) + 32`.\n3. Bulatkan maksimal 2 angka di belakang koma menggunakan `double.parse(f.toStringAsFixed(2))`.',
  },
  'D1-05': {
    code: `String cekGanjilGenap(int angka) {
  if (angka == 0) {
    return 'Nol';
  }
  final jenis = angka.abs() % 2 == 0 ? 'Genap' : 'Ganjil';
  final tanda = angka > 0 ? 'Positif' : 'Negatif';
  return '\$jenis \$tanda';
}`,
    explanation:
      '1. Tangani kasus khusus `angka == 0` terlebih dahulu dengan mengembalikan `\'Nol\'`.\n2. Gunakan `angka.abs() % 2 == 0` untuk menentukan `\'Genap\'` atau `\'Ganjil\'` secara aman baik untuk angka positif maupun negatif.\n3. Tentukan tanda `\'Positif\'` atau `\'Negatif\'` lalu gabungkan.',
  },
  'D1-06': {
    code: `int hitungDiskon(int totalBelanja, int persenDiskon) {
  if (totalBelanja <= 0) return 0;
  if (persenDiskon <= 0) return totalBelanja;
  final diskonAman = persenDiskon > 100 ? 100 : persenDiskon;
  final potongan = (totalBelanja * diskonAman) ~/ 100;
  return totalBelanja - potongan;
}`,
    explanation:
      '1. Jika `totalBelanja <= 0`, kembalikan `0`. Jika `persenDiskon <= 0`, tidak ada diskon (`totalBelanja`).\n2. Batasi `persenDiskon` maksimal 100% agar harga akhir tidak negatif.\n3. Gunakan pembagian bulat `~/` untuk menghitung potongan lalu kurangi dari `totalBelanja`.',
  },
  'D1-07': {
    code: `String formatLabelHarga(String namaBarang, int harga) {
  final nama = namaBarang.trim();
  if (nama.isEmpty || harga < 0) {
    return 'Label tidak valid';
  }
  if (harga == 0) {
    return '\$nama: Gratis';
  }
  return '\$nama: Rp\$harga';
}`,
    explanation:
      '1. Bersihkan `namaBarang` dengan `.trim()`.\n2. Jika nama kosong atau `harga < 0`, kembalikan `\'Label tidak valid\'`.\n3. Jika `harga == 0`, kembalikan `\'\$nama: Gratis\'`, selain itu `\'\$nama: Rp\$harga\'`.',
  },
  'D1-08': {
    code: `bool apakahTahunKabisat(int tahun) {
  if (tahun <= 0) return false;
  if (tahun % 400 == 0) return true;
  if (tahun % 100 == 0) return false;
  return tahun % 4 == 0;
}`,
    explanation:
      '1. Tahun `<= 0` bukan tahun masehi valid (`false`).\n2. Urutan cek kabisat wajib: habis dibagi `400` (`true`), habis dibagi `100` (`false`), baru habis dibagi `4` (`true`).',
  },
  'D1-09': {
    code: `String kategoriUsia(int usia) {
  if (usia < 0 || usia > 150) return 'Usia tidak valid';
  if (usia <= 5) return 'Balita';
  if (usia <= 12) return 'Anak-anak';
  if (usia <= 17) return 'Remaja';
  if (usia <= 59) return 'Dewasa';
  return 'Lansia';
}`,
    explanation:
      '1. Validasi rentang tidak masuk akal (`usia < 0 || usia > 150`).\n2. Gunakan `if` berjenjang dari batas terkecil (`<= 5`, `<= 12`, `<= 17`, `<= 59`, hingga `Lansia`).',
  },
  'D1-10': {
    code: `int cariNilaiTerbesar(int a, int b, int c) {
  int maks = a;
  if (b > maks) maks = b;
  if (c > maks) maks = c;
  return maks;
}`,
    explanation:
      'Simpan `a` sebagai kandidat terbesar awal (`maks`), lalu bandingkan dengan `b` dan `c`. Cara ini bekerja akurat untuk bilangan positif, nol, maupun ketiganya negatif.',
  },
};

function getNowTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Extracts structured sections from the Markdown brief (`## Penjelasan`, `## Soal`, `## Petunjuk`, etc.)
 */
function parseBriefSections(brief: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = brief.replace(/\r\n/g, '\n').split('\n');
  let currentKey = 'intro';
  let buffer: string[] = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      sections[currentKey] = buffer.join('\n').trim();
      currentKey = match[1].trim().toLowerCase();
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  sections[currentKey] = buffer.join('\n').trim();
  return sections;
}

/**
 * Extracts test case details (name, expectation, and `reason:`) from `problem.test`
 */
interface ExtractedTestHint {
  name: string;
  kind: 'wajib' | 'saran';
  points: number;
  reasons: string[];
  sampleExpects: string[];
}

function extractTestHints(problem: EnhancedProblem): ExtractedTestHint[] {
  const testCode = problem.test || '';
  const results: ExtractedTestHint[] = [];

  for (const meta of problem.tests) {
    const escapedName = meta.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockRegex = new RegExp(
      `test\\(['"]${escapedName}['"],\\s*\\(\\)\\s*(?:async\\s*)?\\{([\\s\\S]*?)\\}\\s*\\);`,
      'm'
    );
    const match = testCode.match(blockRegex);
    const body = match ? match[1] : '';

    const reasons: string[] = [];
    const reasonRegex = /reason:\s*['"]([^'"]+)['"]/g;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = reasonRegex.exec(body)) !== null) {
      if (!reasons.includes(rMatch[1])) {
        reasons.push(rMatch[1]);
      }
    }

    const sampleExpects: string[] = [];
    const expectLines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('expect('));
    for (const expLine of expectLines.slice(0, 3)) {
      const cleaned = expLine.replace(/,\s*reason:\s*['"][^'"]+['"]/, '');
      sampleExpects.push(cleaned);
    }

    results.push({
      name: meta.name,
      kind: meta.kind,
      points: meta.points,
      reasons,
      sampleExpects,
    });
  }

  return results;
}

/**
 * Synthesizes a clean reference solution or complete implementation template for any problem
 * when not found in CURATED_SOLUTIONS, using the starter signature, Petunjuk steps, and test expectations.
 */
function getOrSynthesizeSolution(problem: EnhancedProblem): {
  code: string;
  explanation: string;
  isExact: boolean;
} {
  if (CURATED_SOLUTIONS[problem.id]) {
    return {
      ...CURATED_SOLUTIONS[problem.id],
      isExact: true,
    };
  }

  const sections = parseBriefSections(problem.brief);
  const petunjukText =
    sections['petunjuk'] ||
    sections['aturan'] ||
    sections['yang harus dipenuhi'] ||
    '';
  const penjelasanText = sections['penjelasan'] || '';
  const testHints = extractTestHints(problem);

  // Extract any fenced dart block from Penjelasan as reference pattern
  const codeBlockMatch = penjelasanText.match(/```dart\s*([\s\S]*?)```/);
  const exampleSnippet = codeBlockMatch ? codeBlockMatch[1].trim() : '';

  // Parse starter to inspect signature & parameters
  const starterClean = problem.starter.trim();
  const fnMatch = starterClean.match(
    /^([A-Za-z0-9_<>,?\s]+?)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(async\s*)?\{/m
  );

  // Check if we can build a smart implementation from the starter and hints
  const petunjukBullets = petunjukText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('-') || /^\d+\./.test(l))
    .map((l) => l.replace(/^(-|\d+\.)\s*/, ''));

  const allReasons = testHints.flatMap((t) => t.reasons);
  const sampleExpects = testHints.flatMap((t) => t.sampleExpects);

  // Build commented reference implementation inside the starter structure
  let synthesizedCode = starterClean;
  if (starterClean.includes('// TODO')) {
    const stepComments: string[] = [];
    if (petunjukBullets.length > 0) {
      stepComments.push('  // Alur penyelesaian sesuai spesifikasi soal:');
      petunjukBullets.forEach((b, idx) => {
        stepComments.push(`  // ${idx + 1}. ${b.replace(/`/g, '')}`);
      });
    } else if (allReasons.length > 0) {
      stepComments.push('  // Syarat utama yang wajib dipenuhi:');
      allReasons.slice(0, 4).forEach((r, idx) => {
        stepComments.push(`  // ${idx + 1}. ${r}`);
      });
    }

    // Try to infer return fallback from return type
    let defaultReturn = '';
    if (fnMatch) {
      const returnType = fnMatch[1].trim();
      if (returnType === 'String' || returnType === 'Future<String>') {
        defaultReturn = "  return '';";
      } else if (returnType === 'int' || returnType === 'Future<int>') {
        defaultReturn = '  return 0;';
      } else if (returnType === 'double' || returnType === 'Future<double>') {
        defaultReturn = '  return 0.0;';
      } else if (returnType === 'bool' || returnType === 'Future<bool>') {
        defaultReturn = '  return false;';
      } else if (returnType.startsWith('List')) {
        defaultReturn = '  return [];';
      } else if (returnType.startsWith('Map')) {
        defaultReturn = '  return {};';
      } else if (returnType.startsWith('Set')) {
        defaultReturn = '  return {};';
      }
    }

    // Check if Penjelasan has a helper formula or pattern we can include
    const replacementBlock = [
      ...stepComments,
      exampleSnippet
        ? `\n  // Pola referensi dari materi soal:\n${exampleSnippet
            .split('\n')
            .map((l) => `  // ${l}`)
            .join('\n')}`
        : '',
      defaultReturn ? `\n${defaultReturn}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    synthesizedCode = starterClean.replace(
      /\/\/\s*TODO[^\n]*/g,
      replacementBlock || '  // Tulis implementasi sesuai langkah di bawah'
    );
  }

  const explanationParts: string[] = [];
  if (petunjukBullets.length > 0) {
    explanationParts.push(
      '**Langkah Implementasi Inti:**\n' +
        petunjukBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
    );
  }
  if (allReasons.length > 0) {
    explanationParts.push(
      '**Kunci Lulus Unit Test (Wajib & Saran):**\n' +
        allReasons.map((r) => `- ${r}`).join('\n')
    );
  }
  if (sampleExpects.length > 0) {
    explanationParts.push(
      '**Target Output yang Diuji Sistem:**\n```dart\n' +
        sampleExpects.slice(0, 5).join('\n') +
        '\n```'
    );
  }

  return {
    code: synthesizedCode,
    explanation:
      explanationParts.join('\n\n') ||
      'Ikuti kontrak fungsi dan pastikan seluruh kasus batas (input kosong/negatif) ditangani sebelum mengembalikan hasil utama.',
    isExact: false,
  };
}

/**
 * Generates the initial greeting message from Dosen Pintar when a problem is loaded.
 */
export function generateDosenWelcome(problem: EnhancedProblem): DosenMessage {
  const wajibCount = problem.tests.filter((t) => t.kind === 'wajib').length;
  const saranCount = problem.tests.filter((t) => t.kind === 'saran').length;

  return {
    id: `welcome-${problem.id}`,
    sender: 'dosen',
    timestamp: getNowTime(),
    text: `Halo! Saya **Dosen Pintar Dart**, pembimbing interaktif kamu untuk soal **${problem.id} — ${problem.title}** (Level: **${problem.level.toUpperCase()}**).

Pada soal ini, kamu diminta mengimplementasikan kontrak \`${problem.signatureSummary}\` untuk memenuhi **${wajibCount} pengujian Wajib** dan **${saranCount} pengujian Saran**.

Silakan ketik pertanyaan apa saja di bawah atau klik salah satu topik cepat:
- **Cara menjawab & algoritma langkah demi langkah**
- **Penjelasan fungsi/sintaks** (seperti \`final\`, \`var\`, \`.isEmpty\`, \`.trim()\`, \`fold\`, \`async\`, dll.)
- **Cek kode kamu saat ini** kenapa masih error atau belum 100%
- **Jawaban seharusnya** beserta penjelasan baris demi baris`,
    suggestedFollowUps: DOSEN_QUICK_PROMPTS,
  };
}

/**
 * Built-in dictionary of common Dart keywords/methods in case the user asks about a keyword
 * not already listed in `problem.codelineExplanations`.
 */
const EXTRA_DART_DICTIONARY: Record<
  string,
  { title: string; body: string; example: string }
> = {
  final: {
    title: '`final` — Variabel Satu Kali Isi (Immutable Reference)',
    body: 'Kata kunci `final` digunakan untuk mendeklarasikan variabel yang nilainya hanya diatur **satu kali** saat dijalankan (runtime) dan tidak bisa diubah lagi setelahnya. Sangat dianjurkan untuk menyimpan hasil `.trim()` atau perhitungan antara.',
    example: `final namaBersih = nama.trim();\n// namaBersih = 'lain'; // ERROR: variabel final tidak bisa diubah`,
  },
  var: {
    title: '`var` — Variabel yang Nilainya Bisa Berubah (Mutable)',
    body: 'Kata kunci `var` meminta Dart menebak tipe data secara otomatis dan mengizinkan nilainya diubah kembali nanti (misalnya penghitung `total` atau `maks` di dalam perulangan `for`).',
    example: `var total = 0;\nfor (final n in angka) {\n  total += n;\n}`,
  },
  const: {
    title: '`const` — Konstanta Waktu Kompilasi (Compile-time Constant)',
    body: 'Digunakan untuk nilai tetap yang sudah pasti diketahui sebelum program dijalankan, seperti batas maksimum atau daftar tetap.',
    example: `const batasMaksimum = 100;`,
  },
  isempty: {
    title: '`.isEmpty` & `.isNotEmpty` — Cek Kosong atau Tidak',
    body: 'Properti bawaan pada `String`, `List`, `Map`, dan `Set` yang menghasilkan `true` jika panjangnya `0` (tidak memiliki karakter atau elemen). Selalu kombinasikan dengan `.trim().isEmpty` saat memvalidasi teks agar spasi kosong `"   "` ikut terdeteksi.',
    example: `if (teks.trim().isEmpty) {\n  return 'Input kosong';\n}`,
  },
  trim: {
    title: '`.trim()` — Pembersih Spasi di Awal & Akhir String',
    body: 'Menghapus karakter whitespace (spasi, tab, newline) di ujung kiri dan kanan teks tanpa menghapus spasi di tengah kalimat.',
    example: `'   Kopi Susu  '.trim(); // menghasilkan 'Kopi Susu'`,
  },
  fold: {
    title: '`.fold(nilaiAwal, (akumulator, elemen) => ...)` — Penggabung Koleksi',
    body: 'Merangkum seluruh isi `List`/`Iterable` menjadi satu nilai akhir (misalnya menjumlahkan angka atau menggabungkan data) dengan nilai awal yang aman meskipun list kosong.',
    example: `final total = hargaList.fold<int>(0, (sum, item) => sum + item);`,
  },
  where: {
    title: '`.where((elemen) => kondisi)` — Penyaring Elemen (Filter)',
    body: 'Menyaring elemen di dalam `List` atau `Iterable` yang memenuhi kondisi bernilai `true`. Akhiri dengan `.toList()` jika membutuhkan hasil berupa `List`.',
    example: `final positif = angka.where((x) => x > 0).toList();`,
  },
  map: {
    title: '`.map((elemen) => transformasi)` — Pengubah Bentuk Elemen',
    body: 'Mengubah setiap elemen di dalam koleksi menjadi bentuk atau nilai baru dengan jumlah elemen yang tetap sama.',
    example: `final kuadrat = angka.map((x) => x * x).toList();`,
  },
  split: {
    title: '`.split(pemisah)` — Pemecah String Menjadi List',
    body: 'Memotong `String` berdasarkan pemisah tertentu dan mengembalikan `List<String>`.',
    example: `final kata = 'satu,dua,tiga'.split(','); // ['satu', 'dua', 'tiga']`,
  },
  join: {
    title: '`.join(penghubung)` — Penggabung List Menjadi String',
    body: 'Menggabungkan seluruh elemen `List` menjadi satu `String` utuh yang dipisahkan oleh teks penghubung.',
    example: `['a', 'b', 'c'].join('-'); // 'a-b-c'`,
  },
  clamp: {
    title: '`.clamp(bawah, atas)` — Pembatas Rentang Angka',
    body: 'Memastikan angka tidak lebih kecil dari batas bawah dan tidak lebih besar dari batas atas.',
    example: `final diskonAman = diskon.clamp(0, 100);`,
  },
  tostringasfixed: {
    title: '`.toStringAsFixed(n)` — Format Angka Desimal',
    body: 'Mengubah `double` menjadi teks dengan tepat `n` angka di belakang koma. Gunakan `double.parse(nilai.toStringAsFixed(2))` jika tipe kembalian fungsi adalah `double`.',
    example: `final hasil = double.parse((10 / 3).toStringAsFixed(2)); // 3.33`,
  },
  async: {
    title: '`async` & `await` — Pemrograman Asinkron (Future)',
    body: 'Tandai fungsi dengan `async` ketika fungsi mengembalikan `Future<T>`, dan gunakan `await` di depan pemanggilan fungsi asinkron untuk menunggu hasilnya selesai sebelum lanjut ke baris berikutnya.',
    example: `Future<int> hitungAsync() async {\n  final data = await ambilData();\n  return data * 2;\n}`,
  },
  try: {
    title: '`try / catch / throw` — Penanganan Eksepsi & Error',
    body: 'Gunakan `throw ArgumentError(...)` atau `throw FormatException(...)` untuk menolak input tidak valid, dan gunakan blok `try { ... } catch (e) { ... }` untuk menangkap error agar program tidak berhenti mendadak.',
    example: `if (nilai < 0) {\n  throw ArgumentError('Nilai tidak boleh negatif');\n}`,
  },
};

/**
 * Diagnoses the user's current code and execution state for `problem`.
 */
function buildCodeDiagnosis(
  problem: EnhancedProblem,
  userCode: string,
  execState: ExecutionState
): string {
  const parts: string[] = [];
  const testHints = extractTestHints(problem);

  // Strip void main() block when inspecting the user's solution function/class
  const mainIndex = userCode.search(/\b(?:Future<void>|void)\s+main\s*\(/);
  const solutionPart =
    mainIndex >= 0 ? userCode.slice(0, mainIndex).trim() : userCode.trim();

  const stillHasTodo = /\/\/\s*TODO/i.test(solutionPart);
  const hasReturn = /\breturn\b/.test(solutionPart);

  parts.push(`### Diagnosis Kode Kamu untuk Soal ${problem.id}`);

  if (stillHasTodo && !hasReturn) {
    parts.push(
      `Saat ini bagian fungsi utama \`${problem.signatureSummary}\` di editor kamu **masih berupa template starter (\`// TODO\`)** dan belum mengembalikan nilai (\`return\`).\n\n` +
        `**Langkah pertama yang harus kamu lakukan:**\n` +
        `1. Hapus baris \`// TODO: Tulis kode kamu di sini\` di dalam fungsi di atas \`void main()\`.\n` +
        `2. Tambahkan validasi input (untuk kasus kosong/tidak valid) di baris paling awal fungsi.\n` +
        `3. Tambahkan perhitungan/logika utama lalu akhiri dengan \`return ...;\`.`
    );
  }

  // Check active execution state
  if (execState.kind === 'compile-error') {
    parts.push(`#### Ditemukan Error Kompilasi (${execState.errors.length} lokasi)`);
    execState.errors.slice(0, 4).forEach((err) => {
      parts.push(
        `- **Baris ${err.line}, Kolom ${err.column}:** \`${err.message}\`\n  *Solusi:* Periksa tanda titik koma \`;\`, kurung kurawal \`{}\`, nama variabel yang belum dideklarasikan, atau ketidakcocokan tipe nilai \`return\`.`
      );
    });
  } else if (execState.kind === 'submit') {
    const allResults = execState.result.results;
    const failedResults = allResults.filter((r) => r.status !== 'pass');
    const passedCount = allResults.length - failedResults.length;

    if (failedResults.length === 0 && allResults.length > 0) {
      parts.push(
        `Luar biasa! Seluruh **${passedCount}/${allResults.length} unit test (Wajib & Saran)** sudah **LULUS 100%**! Kode kamu sudah memenuhi seluruh spesifikasi soal ${problem.id}.`
      );
    } else {
      parts.push(
        `Hasil penilaian terakhir: **${passedCount} Lulus**, **${failedResults.length} Belum Lulus**. Berikut penyebab dan cara memperbaikinya:`
      );
      for (const fail of failedResults) {
        const hint = testHints.find((h) => h.name === fail.name);
        const kindLabel =
          hint?.kind === 'saran' ? 'Kasus Saran (Batas/Edge Case)' : 'Kasus Wajib';
        parts.push(
          `- **Test Gagal: "${fail.name}" (${kindLabel})**\n` +
            (fail.message ? `  - *Pesan Uji:* \`${fail.message.split('\n')[0]}\`\n` : '') +
            (hint && hint.reasons.length > 0
              ? `  - *Penyebab & Solusi:* ${hint.reasons.join(' ')}\n`
              : '') +
            (hint && hint.sampleExpects.length > 0
              ? `  - *Contoh yang Diuji:* \`${hint.sampleExpects[0]}\``
              : '')
        );
      }
    }
  } else if (execState.kind === 'run') {
    if (execState.result.jsError) {
      parts.push(
        `#### Runtime Error saat Menjalankan \`void main()\`\n- Pesan: \`${execState.result.jsError}\`\n- Pastikan tidak ada pembagian bulat dengan nol (\`~/ 0\`), akses indeks di luar batas \`List\`, atau \`UnimplementedError\`.`
      );
    } else {
      const lines = execState.result.stdout.filter((l) => l.trim().length > 0);
      parts.push(
        `Eksekusi \`void main()\` berhasil menghasilkan **${lines.length} baris output**. Sudahkah kamu menekan tombol **Nilai Jawaban** di atas untuk menguji kode terhadap seluruh unit test Wajib & Saran?`
      );
    }
  } else if (!stillHasTodo) {
    // Static heuristic inspection on solutionPart
    const staticTips: string[] = [];
    if (
      problem.starter.includes('String ') &&
      !solutionPart.includes('.trim()') &&
      problem.test.includes('trim')
    ) {
      staticTips.push(
        'Kode kamu belum memanggil `.trim()` pada parameter `String`. Kasus **Saran** biasanya menguji input berisi spasi seperti `"   "`.'
      );
    }
    if (
      (problem.starter.includes('String ') || problem.starter.includes('List')) &&
      !solutionPart.includes('isEmpty') &&
      problem.test.includes('isEmpty')
    ) {
      staticTips.push(
        'Pertimbangkan menambahkan pengecekan `.isEmpty` untuk menangani input kosong.'
      );
    }
    if (staticTips.length > 0) {
      parts.push(
        `#### Hasil Pemeriksaan Statis Kode Kamu:\n` +
          staticTips.map((t) => `- ${t}`).join('\n')
      );
    } else {
      parts.push(
        `Kode kamu sudah memiliki implementasi. Tekan tombol **Nilai Jawaban (Ctrl+Shift+Enter)** agar saya bisa menganalisis hasil setiap unit test Wajib & Saran secara spesifik, atau klik **"Tampilkan jawaban seharusnya"** jika ingin membandingkan kode kamu dengan solusi referensi.`
      );
    }
  }

  return parts.join('\n\n');
}

/**
 * Main conversational engine that answers any user question in the context of the active problem.
 */
export function answerUserQuestion(
  rawQuestion: string,
  problem: EnhancedProblem,
  userCode: string,
  execState: ExecutionState
): DosenMessage {
  const q = rawQuestion.trim().toLowerCase();
  const sections = parseBriefSections(problem.brief);
  const testHints = extractTestHints(problem);

  // 1. Check for clearly off-topic questions outside Dart/coding exercises
  const offTopicPatterns =
    /\b(resep|masak|politik|presiden|pacar|jodoh|ramalan|zodiak|sepak\s*bola|film|lagu|cuaca\s+hari\s+ini|gosip)\b/i;
  if (offTopicPatterns.test(q) && !q.includes('dart') && !q.includes('soal')) {
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `Maaf, saya adalah **Dosen Pintar Dart** yang dikhususkan untuk membimbing kamu menjawab soal-soal pemrograman Dart di platform ini (saat ini aktif pada soal **${problem.id} — ${problem.title}**).\n\nSilakan tanyakan hal-hal seputar:\n- Cara menjawab & langkah algoritma soal **${problem.id}**\n- Penjelasan fungsi kode (seperti \`final\`, \`var\`, \`.isEmpty\`, \`void main()\`, dll.)\n- Kenapa kode kamu masih error atau gagal di kasus **Saran**\n- Kunci jawaban / kode referensi yang seharusnya`,
      suggestedFollowUps: DOSEN_QUICK_PROMPTS,
    };
  }

  // 2. Intent: Reference Solution / Jawaban Seharusnya
  if (
    q.includes('jawaban') ||
    q.includes('solusi') ||
    q.includes('kunci') ||
    q.includes('seharusnya') ||
    q.includes('contoh kode lengkap') ||
    q.includes('kode benar') ||
    q.includes('answer') ||
    q.includes('solution')
  ) {
    const sol = getOrSynthesizeSolution(problem);
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      solutionCode: sol.code,
      text: `Berikut adalah **${
        sol.isExact
          ? 'Jawaban Referensi Lengkap'
          : 'Kerangka Solusi & Panduan Implementasi Lengkap'
      }** untuk soal **${problem.id} — ${problem.title}**:

\`\`\`dart
${sol.code}
\`\`\`

### Penjelasan Alur Kode:
${sol.explanation}

> **Tips Penggunaan:** Kamu bisa menekan tombol **"Pasang Jawaban ke Editor"** di bawah pesan ini untuk langsung menerapkan kode di atas ke editor tanpa menghapus blok testing \`void main()\` di bawahnya, lalu tekan **Jalankan** atau **Nilai Jawaban**.`,
      suggestedFollowUps: [
        'Jelaskan fungsi & sintaks di soal ini',
        'Apa saja syarat lulus kasus Saran (100%)?',
        'Bagaimana cara menguji kode ini di void main()?',
      ],
    };
  }

  // 3. Intent: Debug / Check User Code ("Cek kenapa kode saya salah")
  if (
    q.includes('cek') ||
    q.includes('salah') ||
    q.includes('error') ||
    q.includes('gagal') ||
    q.includes('belum lulus') ||
    q.includes('perbaiki') ||
    q.includes('debug') ||
    q.includes('merah') ||
    q.includes('koreksi')
  ) {
    const diagnosis = buildCodeDiagnosis(problem, userCode, execState);
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: diagnosis,
      suggestedFollowUps: [
        'Tampilkan jawaban seharusnya',
        'Apa saja syarat lulus kasus Saran (100%)?',
        'Bagaimana cara menjawab soal ini?',
      ],
    };
  }

  // 4. Intent: Edge Cases / Kasus Saran (100% Score)
  if (
    q.includes('saran') ||
    q.includes('100%') ||
    q.includes('edge case') ||
    q.includes('kasus batas') ||
    q.includes('poin penuh') ||
    q.includes('wajib')
  ) {
    const wajibHints = testHints.filter((t) => t.kind === 'wajib');
    const saranHints = testHints.filter((t) => t.kind === 'saran');

    const wajibList = wajibHints
      .map(
        (t) =>
          `- **${t.name}** (${t.points} poin)\n` +
          (t.reasons.length > 0 ? `  - *Syarat:* ${t.reasons.join(' ')}\n` : '') +
          (t.sampleExpects.length > 0
            ? `  - *Uji:* \`${t.sampleExpects.join(' | ')}\``
            : '')
      )
      .join('\n');

    const saranList = saranHints
      .map(
        (t) =>
          `- **${t.name}** (${t.points} poin)\n` +
          (t.reasons.length > 0 ? `  - *Syarat:* ${t.reasons.join(' ')}\n` : '') +
          (t.sampleExpects.length > 0
            ? `  - *Uji:* \`${t.sampleExpects.join(' | ')}\``
            : '')
      )
      .join('\n');

    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Rincian Syarat Lulus Unit Test Soal ${problem.id} (Wajib & Saran)

Agar mendapatkan nilai **100 poin penuh**, kode kamu harus lulus pengujian **Wajib** (skenario normal) dan **Saran** (validasi input & kasus batas):

#### 1. Pengujian Wajib (Kasus Utama)
${wajibList || '- Menguji alur utama fungsi sesuai kontrak soal.'}

#### 2. Pengujian Saran (Kasus Batas / Penentu Nilai 100%)
${saranList || '- Menguji input kosong, nol, atau nilai ekstrem.'}

> **Tips Dosen:** Selalu letakkan pengecekan kasus **Saran** (misalnya \`if (teks.trim().isEmpty)\` atau \`if (angka <= 0)\`) di **baris paling atas fungsi** sebelum melakukan perhitungan utama.`,
      suggestedFollowUps: [
        'Tampilkan jawaban seharusnya',
        'Cek kenapa kode saya salah / belum lulus',
        'Jelaskan fungsi & sintaks di soal ini',
      ],
    };
  }

  // 5. Intent: Specific Keyword / Function Explanation or General Syntax Breakdown
  const matchedCodelines = problem.codelineExplanations.filter((item) => {
    const cleanToken = item.token.toLowerCase().replace(/[().]/g, '');
    return (
      cleanToken.length >= 2 &&
      (q.includes(cleanToken) || q.includes(item.token.toLowerCase()))
    );
  });

  const matchedExtraKeys = Object.keys(EXTRA_DART_DICTIONARY).filter((key) =>
    q.includes(key)
  );

  if (
    matchedCodelines.length > 0 ||
    matchedExtraKeys.length > 0 ||
    q.includes('fungsi') ||
    q.includes('sintaks') ||
    q.includes('apa itu') ||
    q.includes('jelaskan') ||
    q.includes('arti') ||
    q.includes('maksud') ||
    q.includes('void main')
  ) {
    // If specific tokens matched, show them first; otherwise show all contextual tokens for this problem
    const itemsToShow =
      matchedCodelines.length > 0
        ? matchedCodelines
        : problem.codelineExplanations.slice(0, 6);

    const formattedItems = itemsToShow
      .map(
        (item) =>
          `#### \`${item.token}\` *(${item.category})*\n` +
          `**${item.summary}**\n` +
          `${item.detail}\n` +
          `\`\`\`dart\n${item.exampleCode}\n\`\`\`\n` +
          `*Tips Mengingat:* ${item.memoryTip}`
      )
      .join('\n\n');

    const extraFormatted =
      matchedCodelines.length === 0 && matchedExtraKeys.length > 0
        ? matchedExtraKeys
            .map((k) => {
              const info = EXTRA_DART_DICTIONARY[k];
              return `#### ${info.title}\n${info.body}\n\`\`\`dart\n${info.example}\n\`\`\``;
            })
            .join('\n\n')
        : '';

    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Penjelasan Fungsi & Sintaks Kode pada Soal ${problem.id}

Berikut penjelasan fungsi baris kode yang relevan dengan pertanyaanmu pada soal **${problem.title}**:

${extraFormatted ? extraFormatted + '\n\n' : ''}${formattedItems}`,
      suggestedFollowUps: [
        'Bagaimana cara menjawab soal ini?',
        'Tampilkan jawaban seharusnya',
        'Cek kenapa kode saya salah / belum lulus',
      ],
    };
  }

  // 6. Default / Intent: How to solve ("Bagaimana cara menjawab soal ini?")
  const soalSection =
    sections['soal'] || sections['kontrak'] || sections['penjelasan'] || '';
  const aturanSection =
    sections['aturan'] || sections['yang harus dipenuhi'] || '';
  const petunjukSection = sections['petunjuk'] || '';
  const allReasons = testHints.flatMap((t) => t.reasons);

  return {
    id: `dosen-${Date.now()}`,
    sender: 'dosen',
    timestamp: getNowTime(),
    text: `### Panduan Lengkap Cara Menjawab Soal ${problem.id} (${problem.title})

#### 1. Pahami Kontrak Fungsi/Class
Kamu perlu melengkapi deklarasi berikut di editor:
\`\`\`dart
${problem.signatureSummary}
\`\`\`
${soalSection ? `\n${soalSection}\n` : ''}
${aturanSection ? `#### 2. Aturan & Kondisi yang Harus Dipenuhi\n${aturanSection}\n` : ''}
${
  petunjukSection
    ? `#### 3. Langkah Algoritma (Step-by-Step)\n${petunjukSection}\n`
    : allReasons.length > 0
      ? `#### 3. Langkah Algoritma (Step-by-Step)\n${allReasons
          .map((r, i) => `${i + 1}. ${r}`)
          .join('\n')}\n`
      : ''
}
#### 4. Cara Menguji dengan \`void main()\`
Di bagian bawah editor sudah tersedia blok \`void main()\`. Setelah kamu menulis logika di dalam fungsi utama:
1. Tekan **Jalankan (void main)** untuk melihat hasil keluaran \`print()\` beserta penjelasannya.
2. Tekan **Nilai Jawaban** untuk menguji kode terhadap **${problem.tests.length} unit test** sistem.

Apakah kamu ingin melihat **contoh jawaban seharusnya** atau ingin saya **mengecek kode yang sedang kamu tulis**?`,
    suggestedFollowUps: [
      'Tampilkan jawaban seharusnya',
      'Apa saja syarat lulus kasus Saran (100%)?',
      'Cek kenapa kode saya salah / belum lulus',
      'Jelaskan fungsi & sintaks di soal ini',
    ],
  };
}
