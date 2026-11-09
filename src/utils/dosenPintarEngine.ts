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

export interface DosenQuestionCategory {
  id: string;
  label: string;
  questions: string[];
}

export const DOSEN_QUESTION_CATEGORIES: DosenQuestionCategory[] = [
  {
    id: 'progres',
    label: 'Langkah & Progres Kode',
    questions: [
      'Langkah selanjutnya setelah membuat kode ini apa?',
      'Bagaimana cara menjawab soal ini dari awal?',
      'Apakah kode saya sudah lengkap atau masih kurang?',
      'Simulasikan contoh input dan output soal ini',
    ],
  },
  {
    id: 'bedah',
    label: 'Fungsi & Bedah Kode',
    questions: [
      'Fungsi kode yang saya buat saat ini apa saja?',
      'Apakah kode ini hanya menampilkan teks atau mengembalikan nilai (return)?',
      'Apa bedanya print() di void main dengan return di fungsi utama?',
      'Jelaskan semua sintaks & method penting di soal ini',
    ],
  },
  {
    id: 'debug',
    label: 'Cek Error & Nilai 100%',
    questions: [
      'Cek kenapa kode saya salah / belum lulus',
      'Apa saja syarat lulus kasus Saran agar nilai 100%?',
      'Kenapa di void main tampil benar tapi saat Nilai Jawaban gagal?',
      'Bagaimana cara menambah pengujian sendiri di void main()?',
    ],
  },
  {
    id: 'solusi',
    label: 'Konsep & Kunci Jawaban',
    questions: [
      'Tampilkan jawaban seharusnya beserta penjelasan',
      'Apa jawaban pertanyaan konsep / bagian Jelaskan di soal ini?',
      'Apakah ada cara atau algoritma alternatif untuk soal ini?',
    ],
  },
];

export const DOSEN_QUICK_PROMPTS: string[] = [
  'Langkah selanjutnya setelah membuat kode ini apa?',
  'Fungsi kode yang saya buat saat ini apa saja?',
  'Apakah kode ini hanya menampilkan teks atau mengembalikan nilai (return)?',
  'Cek kenapa kode saya salah / belum lulus',
  'Apa saja syarat lulus kasus Saran agar nilai 100%?',
  'Tampilkan jawaban seharusnya beserta penjelasan',
];

/**
 * Curated 100% passing reference solutions matching the exact contracts in `problems.json`.
 */
const CURATED_SOLUTIONS: Record<string, { code: string; explanation: string }> = {
  'D1-01': {
    code: `String sapa(String nama) {
  final bersih = nama.trim();
  if (bersih.isEmpty) {
    return 'Halo, tamu!';
  }
  return 'Halo, \$bersih!';
}`,
    explanation:
      '1. `final bersih = nama.trim();` membuang spasi berlebih di awal dan akhir `nama`.\n2. `if (bersih.isEmpty)` memeriksa apakah setelah dipangkas teksnya kosong (termasuk masukan `\'\'` atau `\'   \'`). Jika kosong, kembalikan `\'Halo, tamu!\'`.\n3. `return \'Halo, \$bersih!\';` menyisipkan nama yang sudah bersih ke dalam kalimat sapaan dan mengembalikan nilainya ke pemanggil.',
  },
  'D1-02': {
    code: `double nilaiAkhir(double tugas, double uts, double uas) {
  final t = tugas.clamp(0, 100).toDouble();
  final ut = uts.clamp(0, 100).toDouble();
  final ua = uas.clamp(0, 100).toDouble();
  final total = (0.3 * t) + (0.3 * ut) + (0.4 * ua);
  return double.parse(total.toStringAsFixed(2));
}`,
    explanation:
      '1. Jepit masing-masing nilai `tugas`, `uts`, dan `uas` ke rentang `0..100` memakai `.clamp(0, 100).toDouble()` agar nilai seperti `120` menjadi `100` dan `-10` menjadi `0`.\n2. Hitung rata-rata berbobot `0.3 * t + 0.3 * ut + 0.4 * ua`.\n3. Bulatkan 2 angka desimal dengan `double.parse(total.toStringAsFixed(2))`.',
  },
  'D1-03': {
    code: `String predikat(double nilai) {
  if (nilai < 0 || nilai > 100) {
    return 'tidak sah';
  }
  if (nilai >= 80) return 'A';
  if (nilai >= 70) return 'B';
  if (nilai >= 60) return 'C';
  if (nilai >= 50) return 'D';
  return 'E';
}`,
    explanation:
      '1. Baris pertama wajib menolak nilai di luar `0..100` (`nilai < 0 || nilai > 100`) dengan mengembalikan `\'tidak sah\'`.\n2. Periksa batas dari yang paling tinggi (`>= 80` untuk `\'A\'`, `>= 70` untuk `\'B\'`, `>= 60` untuk `\'C\'`, `>= 50` untuk `\'D\'`), dan sisanya `\'E\'`.',
  },
  'D1-04': {
    code: `List<String> deret(int n) {
  if (n <= 0) return [];
  final hasil = <String>[];
  for (var i = 1; i <= n; i++) {
    if (i % 15 == 0) {
      hasil.add('FizzBuzz');
    } else if (i % 3 == 0) {
      hasil.add('Fizz');
    } else if (i % 5 == 0) {
      hasil.add('Buzz');
    } else {
      hasil.add(i.toString());
    }
  }
  return hasil;
}`,
    explanation:
      '1. Jika `n <= 0`, langsung kembalikan daftar kosong `[]`.\n2. Lakukan perulangan `for` dari `1` sampai `n`.\n3. Periksa kelipatan 3 sekaligus 5 (`i % 15 == 0`) paling atas menjadi `\'FizzBuzz\'`, lalu kelipatan 3 (`\'Fizz\'`), kelipatan 5 (`\'Buzz\'`), dan selain itu `i.toString()`.',
  },
  'D1-05': {
    code: `List<double> yangLulus(List<double> nilai) {
  return nilai.where((n) => n >= 60).toList();
}

double rataRata(List<double> nilai) {
  if (nilai.isEmpty) return 0;
  final total = nilai.fold<double>(0, (a, b) => a + b);
  return total / nilai.length;
}`,
    explanation:
      '1. Pada `yangLulus`, gunakan `.where((n) => n >= 60).toList()` untuk menyaring nilai lulus dengan mempertahankan urutan asli.\n2. Pada `rataRata`, cek `if (nilai.isEmpty) return 0;` terlebih dahulu agar tidak terjadi pembagian dengan nol (`NaN`), lalu jumlahkan dengan `.fold` dan bagi `nilai.length`.',
  },
  'D1-06': {
    code: `Map<String, int> frekuensi(List<String> kata) {
  final hasil = <String, int>{};
  for (final item in kata) {
    final kunci = item.toLowerCase();
    hasil[kunci] = (hasil[kunci] ?? 0) + 1;
  }
  return hasil;
}`,
    explanation:
      '1. Buat `Map<String, int>` kosong bernama `hasil`.\n2. Ubah setiap kata ke huruf kecil dengan `item.toLowerCase()` agar `\'Ayu\'` dan `\'ayu\'` dihitung sebagai kunci yang sama.\n3. Gunakan `(hasil[kunci] ?? 0) + 1` untuk menambah hitungan kemunculan.',
  },
  'D1-07': {
    code: `String alamat(String jalan, {String? kota, String? provinsi, String? kodePos}) {
  final bagian = <String>[jalan];
  if (kota != null && kota.isNotEmpty) {
    bagian.add(kota);
  }
  if (provinsi != null && provinsi.isNotEmpty) {
    bagian.add(provinsi);
  }
  var gabung = bagian.join(', ');
  if (kodePos != null && kodePos.isNotEmpty) {
    gabung = '\$gabung \$kodePos';
  }
  return gabung;
}`,
    explanation:
      '1. Kumpulkan `jalan`, `kota` (jika tidak null), dan `provinsi` (jika tidak null) ke dalam list `bagian`, lalu gabungkan dengan `bagian.join(\', \')`.\n2. Jika `kodePos` diisi, tempelkan di bagian paling akhir menggunakan pemisah **spasi** (`\'\$gabung \$kodePos\'`), bukan koma.',
  },
  'D1-08': {
    code: `class Mahasiswa {
  final String npm;
  final String nama;
  final double ipk;

  const Mahasiswa(this.npm, this.nama, this.ipk);

  bool get lulus => ipk >= 2.0;

  @override
  String toString() => 'Mahasiswa(\$npm, \$nama, \${ipk.toStringAsFixed(2)})';

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is Mahasiswa && other.npm == npm);

  @override
  int get hashCode => npm.hashCode;
}`,
    explanation:
      '1. Getter `lulus` mengembalikan `ipk >= 2.0`.\n2. `toString()` menampilkan `npm`, `nama`, dan `ipk.toStringAsFixed(2)`.\n3. Timpa `operator ==` dan `hashCode` berdasarkan `npm` agar dua objek `Mahasiswa` dengan NPM yang sama dianggap identik oleh `==` maupun `Set`.',
  },
  'D1-09': {
    code: `String ringkasProfil(Map<String, String?> data) {
  final nama = data['nama'] ?? 'tanpa nama';
  final kota = data['kota'] ?? 'kota tidak diketahui';
  final telepon = data['telepon'] ?? 'tanpa telepon';
  return '\$nama dari \$kota (\$telepon)';
}`,
    explanation:
      'Gunakan operator null-coalescing `??` untuk setiap kunci (`nama`, `kota`, `telepon`) agar ketika nilainya `null` atau kuncinya tidak ada di dalam `Map`, otomatis diganti dengan teks bawaan tanpa memicu error.',
  },
  'D1-10': {
    code: `double totalLulus(List<double> nilai) {
  return nilai.where((n) => n >= 60).fold(0.0, (a, b) => a + b);
}

List<String> namaRapi(List<String> nama) {
  return nama
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .map((s) => s[0].toUpperCase() + s.substring(1).toLowerCase())
      .toList();
}`,
    explanation:
      '1. `totalLulus` merangkai `.where((n) => n >= 60).fold(0.0, (a, b) => a + b)` dalam satu lintasan malas (lazy) tanpa menyalin list, sehingga sangat cepat untuk 100.000 data.\n2. `namaRapi` memangkas spasi (`.trim()`), membuang yang kosong (`.where((s) => s.isNotEmpty)`), lalu mengubah huruf pertama menjadi kapital dan sisanya huruf kecil.',
  },
  'D1-11': {
    code: `double bagi(double a, double b) {
  if (b == 0) {
    throw ArgumentError('Pembagi tidak boleh nol');
  }
  return a / b;
}

String bagiAman(double a, double b) {
  try {
    return bagi(a, b).toString();
  } on ArgumentError catch (e) {
    return e.message.toString();
  }
}`,
    explanation:
      '1. Di `bagi(a, b)`, periksa `if (b == 0)` dan lempar `ArgumentError` dengan pesan yang memuat kata `"nol"`.\n2. Di `bagiAman(a, b)`, bungkus pemanggilan `bagi(a, b)` di dalam `try / on ArgumentError catch (e)` lalu kembalikan hasil `.toString()` atau pesan kesalahannya.',
  },
  'D1-12': {
    code: `Future<List<String>> ambilSemua(
    List<String> id, Future<String> Function(String) ambil) async {
  return await Future.wait(id.map(ambil));
}`,
    explanation:
      'Gunakan `id.map(ambil)` untuk memulai semua `Future` secara paralel (bersamaan), lalu tunggu seluruhnya selesai sekaligus dengan `await Future.wait(...)`. Cara ini menjaga urutan hasil dan jauh lebih cepat daripada `await` di dalam loop `for`.',
  },
  'D1-13': {
    code: `double keFahrenheit(double celsius) {
  final f = celsius * 9 / 5 + 32;
  return double.parse(f.toStringAsFixed(1));
}`,
    explanation:
      'Hitung `celsius * 9 / 5 + 32`, lalu bulatkan ke 1 angka di belakang koma menggunakan `double.parse(f.toStringAsFixed(1))`.',
  },
  'D1-14': {
    code: `String jenisBilangan(int n) {
  if (n == 0) return 'nol';
  return n % 2 == 0 ? 'genap' : 'ganjil';
}`,
    explanation:
      'Periksa `n == 0` terlebih dahulu untuk mengembalikan `\'nol\'`. Setelah itu, gunakan `n % 2 == 0` (atau `n.isEven`) yang bekerja akurat baik untuk bilangan positif maupun negatif.',
  },
  'D1-15': {
    code: `int terbesar(int a, int b, int c) {
  var juara = a;
  if (b > juara) juara = b;
  if (c > juara) juara = c;
  return juara;
}`,
    explanation:
      'Mulai `juara` dari nilai pertama (`a`), bukan dari `0`, agar tetap akurat ketika ketiga bilangan bernilai negatif.',
  },
  'D1-16': {
    code: `int faktorial(int n) {
  if (n < 0) {
    throw ArgumentError('n tidak boleh negatif');
  }
  var hasil = 1;
  for (var i = 2; i <= n; i++) {
    hasil *= i;
  }
  return hasil;
}`,
    explanation:
      'Lempar `ArgumentError` jika `n < 0`. Mulai `hasil = 1` dan kalikan dari `2` sampai `n` sehingga `0!` dan `1!` otomatis menghasilkan `1`.',
  },
  'D1-17': {
    code: `bool apakahPrima(int n) {
  if (n < 2) return false;
  for (var i = 2; i * i <= n; i++) {
    if (n % i == 0) return false;
  }
  return true;
}`,
    explanation:
      'Bilangan `< 2` bukan prima (`false`). Periksa pembagi dari `2` cukup sampai `i * i <= n` (akar kuadrat `n`) agar pengujian bilangan ratusan juta selesai dalam hitungan milidetik.',
  },
  'D1-18': {
    code: `String balik(String teks) {
  return teks.split('').reversed.join();
}`,
    explanation:
      '`teks.split(\'\')` memecah teks menjadi daftar karakter (termasuk spasi), `.reversed` membalik urutannya, dan `.join()` menyatukannya kembali menjadi `String`.',
  },
  'D1-19': {
    code: `bool apakahPalindrom(String teks) {
  final bersih = teks.toLowerCase().replaceAll(' ', '');
  return bersih == bersih.split('').reversed.join();
}`,
    explanation:
      'Samakan huruf menjadi kecil semua dengan `.toLowerCase()` dan buang spasi dengan `.replaceAll(\' \', \'\')`, lalu bandingkan dengan kebalikannya.',
  },
  'D2-01': {
    code: `String rupiah(int n) {
  final negatif = n < 0;
  final digit = n.abs().toString();
  final buf = StringBuffer();
  for (var i = 0; i < digit.length; i++) {
    if (i > 0 && (digit.length - i) % 3 == 0) {
      buf.write('.');
    }
    buf.write(digit[i]);
  }
  return '\${negatif ? '-' : ''}Rp\${buf.toString()}';
}`,
    explanation:
      '1. Simpan tanda negatif (`n < 0`), lalu ambil nilai mutlak `n.abs().toString()`.\n2. Sisipkan titik `.` setiap kali sisa digit di kanan habis dibagi 3 (`(digit.length - i) % 3 == 0`).\n3. Gabungkan awalan `-Rp` (jika negatif) atau `Rp` dengan hasil pemformatan.',
  },
  'D2-02': {
    code: `bool npmSah(String npm) {
  if (npm.length != 10) return false;
  if (!RegExp(r'^\\d{10}\$').hasMatch(npm)) return false;
  final angkatan = int.parse(npm.substring(0, 2));
  final prodi = npm.substring(2, 4);
  if (angkatan < 20 || angkatan > 26) return false;
  if (prodi == '00') return false;
  return true;
}`,
    explanation:
      '1. Pastikan panjang tepat 10 karakter dan seluruhnya digit angka `0-9`.\n2. Ambil 2 digit pertama sebagai `angkatan` (wajib `20..26`) dan 2 digit berikutnya sebagai `prodi` (tidak boleh `\'00\'`).',
  },
  'D2-03': {
    code: `String ringkas(String teks, int batas) {
  if (batas <= 0) return '';
  if (teks.length <= batas) return teks;
  if (batas <= 3) return teks.substring(0, batas);
  final maksIsi = batas - 3;
  final potong = teks.substring(0, maksIsi + 1);
  final spasiTerakhir = potong.lastIndexOf(' ');
  if (spasiTerakhir > 0) {
    final kataUtuh = potong.substring(0, spasiTerakhir).trimRight();
    if (kataUtuh.isNotEmpty) {
      return '\$kataUtuh...';
    }
  }
  return '\${teks.substring(0, maksIsi).trimRight()}...';
}`,
    explanation:
      '1. Jika `teks.length <= batas`, kembalikan utuh. Jika `batas <= 3`, kembalikan potongan tanpa `...`.\n2. Sisakan 3 karakter untuk `...` (`maksIsi = batas - 3`), cari batas spasi terakhir agar tidak memenggal di tengah kata, lalu buang spasi menggantung dengan `.trimRight()`.',
  },
  'D2-04': {
    code: `Map<String, double> statistik(List<double> nilai) {
  if (nilai.isEmpty) {
    throw ArgumentError('Daftar nilai tidak boleh kosong');
  }
  final urut = [...nilai]..sort();
  final min = urut.first;
  final maks = urut.last;
  var total = 0.0;
  for (final x in urut) {
    total += x;
  }
  final rata = total / urut.length;
  final tengah = urut.length ~/ 2;
  final median = urut.length.isOdd
      ? urut[tengah]
      : (urut[tengah - 1] + urut[tengah]) / 2.0;
  return {
    'min': min,
    'maks': maks,
    'rata': rata,
    'median': median,
  };
}`,
    explanation:
      '1. Lempar `ArgumentError` bila `nilai.isEmpty`.\n2. Salin daftar (`[...nilai]..sort()`) agar daftar asli milik pemanggil tidak berubah.\n3. Ambil `first` (min), `last` (maks), rata-rata, dan nilai tengah (`median`) untuk panjang ganjil maupun genap.',
  },
  'D2-05': {
    code: `Map<String, List<String>> kelompokkan(List<String> nama) {
  final grup = <String, Set<String>>{};
  for (final mentah in nama) {
    final bersih = mentah.trim();
    if (bersih.isEmpty) continue;
    final kunci = bersih[0].toUpperCase();
    grup.putIfAbsent(kunci, () => <String>{}).add(bersih);
  }
  final hasil = <String, List<String>>{};
  final kunciUrut = grup.keys.toList()..sort();
  for (final k in kunciUrut) {
    final daftar = grup[k]!.toList()
      ..sort((a, b) {
        final cmp = a.toLowerCase().compareTo(b.toLowerCase());
        return cmp != 0 ? cmp : a.compareTo(b);
      });
    hasil[k] = daftar;
  }
  return hasil;
}`,
    explanation:
      '1. Bersihkan spasi tiap nama dengan `.trim()`, lewati yang kosong, dan gunakan `Set<String>` agar nama yang sama persis tidak digandakan.\n2. Kelompokkan berdasarkan huruf awal kapital (`bersih[0].toUpperCase()`) lalu urutkan isi tiap kelompok secara case-insensitive.',
  },
  'D2-06': {
    code: `double saldo(List<String> transaksi) {
  var uang = 0.0;
  for (final baris in transaksi) {
    final bagian = baris.trim().split(RegExp(r'\\s+'));
    if (bagian.length != 2) {
      throw const FormatException('Format transaksi salah');
    }
    final perintah = bagian[0];
    final jumlah = double.tryParse(bagian[1]);
    if (jumlah == null || jumlah < 0) {
      throw const FormatException('Jumlah tidak valid');
    }
    if (perintah == 'masuk') {
      uang += jumlah;
    } else if (perintah == 'keluar') {
      if (jumlah > uang) {
        throw StateError('Saldo tidak mencukupi');
      }
      uang -= jumlah;
    } else {
      throw const FormatException('Perintah tidak dikenal');
    }
  }
  return uang;
}`,
    explanation:
      '1. Pecah tiap baris dengan `trim().split(RegExp(r\'\\\\s+\'))` agar tahan terhadap spasi berlebih.\n2. Lempar `FormatException` jika bukan 2 bagian, perintah selain `masuk`/`keluar`, atau angka negatif.\n3. Lempar `StateError` jika penarikan `keluar` melebihi `uang` saat itu.',
  },
  'HD-01': {
    code: `int tampungAir(List<int> tinggi) {
  var kiri = 0;
  var kanan = tinggi.length - 1;
  var maksKiri = 0;
  var maksKanan = 0;
  var total = 0;
  while (kiri <= kanan) {
    if (maksKiri <= maksKanan) {
      if (tinggi[kiri] > maksKiri) {
        maksKiri = tinggi[kiri];
      } else {
        total += maksKiri - tinggi[kiri];
      }
      kiri++;
    } else {
      if (tinggi[kanan] > maksKanan) {
        maksKanan = tinggi[kanan];
      } else {
        total += maksKanan - tinggi[kanan];
      }
      kanan--;
    }
  }
  return total;
}`,
    explanation:
      'Gunakan dua penunjuk (`kiri` dan `kanan`) beserta `maksKiri` dan `maksKanan`. Pada tiap langkah, proses sisi yang memiliki maksimum lebih kecil dalam waktu linear `O(n)` dan ruang `O(1)`.',
  },
  'HD-02': {
    code: `int wadahTerbanyak(List<int> tinggi) {
  var kiri = 0;
  var kanan = tinggi.length - 1;
  var maksLuas = 0;
  while (kiri < kanan) {
    final tKiri = tinggi[kiri];
    final tKanan = tinggi[kanan];
    final tinggiAir = tKiri < tKanan ? tKiri : tKanan;
    final luas = (kanan - kiri) * tinggiAir;
    if (luas > maksLuas) maksLuas = luas;
    if (tKiri <= tKanan) {
      kiri++;
    } else {
      kanan--;
    }
  }
  return maksLuas;
}`,
    explanation:
      'Mulai dengan pointer di ujung paling kiri dan kanan. Hitung luas `(kanan - kiri) * min(tinggi[kiri], tinggi[kanan])`, lalu geser pointer yang tiangnya lebih pendek ke dalam.',
  },
  'HD-03': {
    code: `int persegiTerbesar(List<int> tinggi) {
  final stack = <int>[];
  var maksLuas = 0;
  for (var i = 0; i <= tinggi.length; i++) {
    final tSekarang = i == tinggi.length ? 0 : tinggi[i];
    while (stack.isNotEmpty && tSekarang < tinggi[stack.last]) {
      final t = tinggi[stack.removeLast()];
      final lebar = stack.isEmpty ? i : i - stack.last - 1;
      final luas = t * lebar;
      if (luas > maksLuas) maksLuas = luas;
    }
    stack.add(i);
  }
  return maksLuas;
}`,
    explanation:
      'Gunakan monotonic increasing stack berisi indeks gedung. Saat menemukan gedung yang lebih pendek (atau `0` di akhir list), keluarkan puncak stack dan hitung luas persegi panjang dengan tinggi gedung tersebut.',
  },
  'HD-04': {
    code: `List<int> maksGeser(List<int> angka, int k) {
  if (angka.isEmpty || k <= 0) return [];
  final deque = <int>[];
  final hasil = <int>[];
  var head = 0;
  for (var i = 0; i < angka.length; i++) {
    if (head < deque.length && deque[head] <= i - k) {
      head++;
    }
    while (deque.length > head && angka[deque.last] <= angka[i]) {
      deque.removeLast();
    }
    deque.add(i);
    if (i >= k - 1) {
      hasil.add(angka[deque[head]]);
    }
  }
  return hasil;
}`,
    explanation:
      'Simpan indeks dalam antrean monotonik menurun (`deque` dengan penunjuk `head` agar operasi buang depan `O(1)`). Setiap kali `i >= k - 1`, elemen di `deque[head]` adalah nilai maksimum jendela saat ini.',
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
 * Extracts structured sections from the Markdown brief (`## Penjelasan`, `## Soal`, `## Petunjuk`, `## Jelaskan`, etc.)
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
      `test\\(['"]${escapedName}['"],\\s*\\(\\)\\s*(?:async\\s*)?\\{([\\s\\S]*?)\\}\\s*(?:,\\s*timeout:[\\s\\S]*?)?\\);`,
      'm'
    );
    const match = testCode.match(blockRegex);
    const body = match ? match[1] : '';

    const reasons: string[] = [];
    const reasonRegex = /reason:\s*(['"][\s\S]*?['"])(?=\s*\)|\s*,)/g;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = reasonRegex.exec(body)) !== null) {
      const cleanedReason = rMatch[1]
        .replace(/['"]\s*\+\s*['"]/g, '')
        .replace(/['"]\s*\n\s*['"]/g, '')
        .replace(/^['"]|['"]$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanedReason && !reasons.includes(cleanedReason)) {
        reasons.push(cleanedReason);
      }
    }

    const sampleExpects: string[] = [];
    const expectLines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('expect('));
    for (const expLine of expectLines.slice(0, 3)) {
      const cleaned = expLine.replace(/,\s*reason:.*$/, ')');
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
 * Synthesizes a working solution or complete implementation from `CURATED_SOLUTIONS`,
 * or by combining the code block in `## Penjelasan` and algorithm in `## Petunjuk` with `problem.starter`.
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
  const penjelasanText = sections['penjelasan'] || '';
  const petunjukText =
    sections['petunjuk'] ||
    sections['aturan'] ||
    sections['yang harus dipenuhi'] ||
    '';
  const testHints = extractTestHints(problem);

  // Extract fenced dart block from Penjelasan
  const codeBlockMatch = penjelasanText.match(/```dart\s*([\s\S]*?)```/);
  const snippetFromBrief = codeBlockMatch ? codeBlockMatch[1].trim() : '';

  const starterClean = problem.starter.trim();
  const petunjukBullets = petunjukText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('-') || /^\d+\./.test(l))
    .map((l) => l.replace(/^(-|\d+\.)\s*/, ''));

  const allReasons = testHints.flatMap((t) => t.reasons);
  const sampleExpects = testHints.flatMap((t) => t.sampleExpects);

  let synthesizedCode = starterClean;

  // Check if snippetFromBrief is a direct implementation snippet we can embed into the starter
  const isRunnableBodySnippet =
    snippetFromBrief.length > 0 &&
    (snippetFromBrief.includes('for (') ||
      snippetFromBrief.includes('while (') ||
      snippetFromBrief.includes('final ') ||
      snippetFromBrief.includes('var ') ||
      snippetFromBrief.includes('return ')) &&
    !snippetFromBrief.includes('void main');

  if (isRunnableBodySnippet) {
    const indentedSnippet = snippetFromBrief
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');

    // Detect if snippet defines a result accumulator variable
    let inferredReturnVar: string | null = null;
    for (const candidate of [
      'terbaik',
      'paling',
      'jawab',
      'selamat',
      'hasil',
      'total',
      'maks',
      'kandidat',
    ]) {
      if (new RegExp(`\\b${candidate}\\b`).test(snippetFromBrief)) {
        inferredReturnVar = candidate;
        break;
      }
    }

    if (starterClean.includes('// TODO')) {
      synthesizedCode = starterClean.replace(
        /\/\/\s*TODO[^\n]*/g,
        indentedSnippet
      );
      if (
        inferredReturnVar &&
        !snippetFromBrief.includes('return ') &&
        /return\s+[^;]+;/.test(synthesizedCode)
      ) {
        synthesizedCode = synthesizedCode.replace(
          /return\s+([^;]+);/,
          `return ${inferredReturnVar};`
        );
      }
    }
  } else if (starterClean.includes('// TODO')) {
    const stepLines: string[] = [];
    if (petunjukBullets.length > 0) {
      petunjukBullets.forEach((b, idx) => {
        stepLines.push(`  // Langkah ${idx + 1}: ${b.replace(/`/g, '')}`);
      });
    } else if (petunjukText) {
      petunjukText
        .split('. ')
        .filter((s) => s.trim().length > 0)
        .slice(0, 4)
        .forEach((s, idx) => {
          stepLines.push(
            `  // Langkah ${idx + 1}: ${s.replace(/\n/g, ' ').trim()}`
          );
        });
    }
    if (stepLines.length > 0) {
      synthesizedCode = starterClean.replace(
        /\/\/\s*TODO[^\n]*/g,
        stepLines.join('\n')
      );
    }
  }

  const explanationParts: string[] = [];
  if (petunjukBullets.length > 0) {
    explanationParts.push(
      '**Tahapan Algoritma Penyelesaian:**\n' +
        petunjukBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')
    );
  } else if (petunjukText) {
    explanationParts.push(`**Panduan Inti & Rumus Kunci:**\n${petunjukText}`);
  }
  if (allReasons.length > 0) {
    explanationParts.push(
      '**Syarat Lulus Unit Test (Wajib & Saran):**\n' +
        allReasons.slice(0, 6).map((r) => `- ${r}`).join('\n')
    );
  }
  if (sampleExpects.length > 0) {
    explanationParts.push(
      '**Contoh Kasus Uji yang Harus Terpenuhi:**\n```dart\n' +
        sampleExpects.slice(0, 5).join('\n') +
        '\n```'
    );
  }

  return {
    code: synthesizedCode,
    explanation:
      explanationParts.join('\n\n') ||
      'Ikuti kontrak fungsi dan pastikan seluruh kasus batas (input kosong/negatif) ditangani sebelum mengembalikan hasil utama.',
    isExact: isRunnableBodySnippet,
  };
}

/**
 * Separates the user's solution code from the `void main()` testing block.
 */
function splitUserSolutionAndMain(userCode: string): {
  solutionPart: string;
  mainPart: string;
  activeBodyLines: string[];
} {
  const mainMatch = userCode.search(
    /(?:\/\/\s*=+\s*\n\s*\/\/\s*BLOK TESTING|\b(?:Future<void>|void)\s+main\s*\()/
  );
  const solutionPart =
    mainMatch >= 0 ? userCode.slice(0, mainMatch).trim() : userCode.trim();
  const mainPart = mainMatch >= 0 ? userCode.slice(mainMatch).trim() : '';

  const solLines = solutionPart.split('\n');
  const activeBodyLines = solLines
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 0 &&
        !l.startsWith('//') &&
        !l.startsWith('/*') &&
        !l.startsWith('*') &&
        !l.endsWith('{') &&
        l !== '}'
    );

  return { solutionPart, mainPart, activeBodyLines };
}

/**
 * Explains a single line of Dart code in clear Indonesian, including whether it prints or returns.
 */
function explainSingleDartLine(line: string, lineNumber?: number): string {
  const t = line.trim();
  const prefix = lineNumber ? `**Baris ${lineNumber}** (\`${t}\`): ` : `\`${t}\` → `;

  if (!t || t.startsWith('//')) {
    return `${prefix}Baris komentar (catatan penjelas untuk manusia, **diabaikan oleh kompiler Dart** dan tidak menghasilkan output).`;
  }
  if (t.startsWith('void main') || t.startsWith('Future<void> main')) {
    return `${prefix}Deklarasi fungsi pintu masuk utama (\`main\`) tempat kamu menjalankan pengujian manual dengan tombol **Jalankan**.`;
  }
  if (t.startsWith('print(')) {
    return `${prefix}**Hanya menampilkan teks ke layar konsol Output** saat tombol **Jalankan (void main)** ditekan. Perlu diingat: \`print()\` **tidak mengembalikan nilai** ke sistem penilai unit test.`;
  }
  if (t.startsWith('return ')) {
    const expr = t.slice(7).replace(/;$/, '').trim();
    return `${prefix}**Mengembalikan nilai akhir (\`${expr}\`) dari fungsi** ke pemanggil (baik ke \`void main()\` maupun ke sistem **Nilai Jawaban**) sekaligus menghentikan jalannya fungsi di titik ini.`;
  }
  if (t.startsWith('throw ')) {
    return `${prefix}**Melemparkan eksepsi/error sengaja** untuk menolak input yang tidak sah sesuai aturan kontrak soal.`;
  }
  if (t.startsWith('final ') || t.startsWith('const ') || t.startsWith('var ')) {
    const isFinal = t.startsWith('final ') || t.startsWith('const ');
    const rhs = t.includes('=') ? t.split('=').slice(1).join('=').replace(/;$/, '').trim() : '';
    let extra = '';
    if (rhs.includes('.trim()')) {
      extra = ' Method `.trim()` di sini berfungsi membuang spasi berlebih di ujung kiri dan kanan teks.';
    } else if (rhs.includes('.clamp(')) {
      extra = ' Method `.clamp(...)` menjepit angka agar tidak keluar dari batas minimum dan maksimum.';
    } else if (rhs.includes('.where(')) {
      extra = ' Method `.where(...)` menyaring elemen koleksi yang memenuhi syarat.';
    } else if (rhs.includes('.fold(')) {
      extra = ' Method `.fold(...)` mengakumulasi/menjumlahkan seluruh isi koleksi menjadi satu nilai.';
    } else if (rhs.includes('.toLowerCase()')) {
      extra = ' Method `.toLowerCase()` mengubah seluruh huruf menjadi huruf kecil agar perbandingan tidak peka huruf besar-kecil.';
    }
    return `${prefix}Mendeklarasikan variabel ${
      isFinal ? 'tetap (`final`/`const` — diisi sekali)' : 'yang bisa diubah (`var`)'
    } dan menyimpan hasil ekspresi \`${rhs}\` di memori.${extra} *(Baris ini memproses data di memori, belum menampilkan ke layar).*`;
  }
  if (t.startsWith('if ') || t.startsWith('if(') || t.startsWith('} else if')) {
    const condMatch = t.match(/if\s*\((.+)\)/);
    const cond = condMatch ? condMatch[1] : t;
    let condNote = '';
    if (cond.includes('.isEmpty')) {
      condNote = ' (memeriksa apakah teks/koleksi kosong)';
    } else if (cond.includes('<= 0') || cond.includes('< 0')) {
      condNote = ' (memeriksa apakah angka bernilai nol atau negatif)';
    }
    return `${prefix}**Percabangan kondisi** yang mengecek apakah syarat \`${cond}\`${condNote} bernilai \`true\`. Jika benar, blok di dalamnya dijalankan.`;
  }
  if (t.startsWith('else') || t.startsWith('} else')) {
    return `${prefix}Blok alternatif yang dijalankan jika seluruh kondisi \`if\` di atasnya bernilai \`false\`.`;
  }
  if (t.startsWith('for ') || t.startsWith('for(') || t.startsWith('while ') || t.startsWith('while(')) {
    return `${prefix}**Perulangan (loop)** untuk memproses data secara berulang selama syarat perulangan masih terpenuhi.`;
  }
  if (
    /^(String|int|double|bool|void|List|Map|Set|Future|class)\b/.test(t)
  ) {
    return `${prefix}**Header deklarasi fungsi/class** yang mendefinisikan nama, parameter masukan (input), dan tipe data nilai kembalian (output).`;
  }

  return `${prefix}Pernyataan operasi logika/pemrosesan data di dalam blok kode.`;
}

/**
 * Feature 1: Live Next-Step Advisor
 * Answers: "Langkah selanjutnya setelah membuat kode ini apa?" / "Habis ini ngapain?"
 */
function buildNextStepGuidance(
  problem: EnhancedProblem,
  userCode: string,
  execState: ExecutionState
): DosenMessage {
  const { solutionPart, activeBodyLines } = splitUserSolutionAndMain(userCode);
  const sol = getOrSynthesizeSolution(problem);
  const testHints = extractTestHints(problem);
  const sections = parseBriefSections(problem.brief);

  // Extract active body lines of our reference solution
  const solSplit = splitUserSolutionAndMain(sol.code);
  const targetLines = solSplit.activeBodyLines.filter(
    (l) => !l.startsWith('//')
  );

  // Check if user only has default return or TODO
  const hasTodo = /\/\/\s*TODO/i.test(solutionPart);
  const isDefaultStub =
    activeBodyLines.length <= 1 &&
    (activeBodyLines.length === 0 ||
      /^return\s+(''|""|0|0\.0|false|\[\]|\{\}|DateTime\(1970\)|List<[^>]+>\.(?:filled|from)\([^)]+\));$/.test(
        activeBodyLines[0]
      ) ||
      activeBodyLines[0].includes('TODO'));

  // Check if user already passed 100%
  if (
    execState.kind === 'submit' &&
    execState.result.results.length > 0 &&
    execState.result.results.every((r) => r.status === 'pass')
  ) {
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Progres Kamu: Sudah Lulus 100% (Sempurna!)

Selamat! Kode yang kamu tulis untuk **${problem.id} — ${problem.title}** sudah melewati seluruh pengujian **Wajib** dan **Saran**.

#### Langkah Selanjutnya yang Bisa Kamu Lakukan:
1. **Eksperimen di \`void main()\`**: Coba ubah-ubah nilai argumen di dalam blok \`void main()\` di bagian bawah editor lalu tekan **Jalankan (Ctrl+Enter)** untuk menguji kasus buatanmu sendiri.
2. **Pahami Konsep & Efisiensi**: Pastikan kamu memahami *mengapa* solusi ini efisien (klik tombol *"Apa jawaban pertanyaan konsep / bagian Jelaskan di soal ini?"* di bawah).
3. **Lanjut ke Soal Berikutnya**: Gunakan tombol panah navigasi soal di kanan atas halaman untuk menaklukkan tantangan berikutnya!`,
      suggestedFollowUps: [
        'Apa jawaban pertanyaan konsep / bagian Jelaskan di soal ini?',
        'Fungsi kode yang saya buat saat ini apa saja?',
        'Apakah ada cara atau algoritma alternatif untuk soal ini?',
      ],
    };
  }

  // Case 1: User hasn't written custom logic yet (still starter stub)
  if (isDefaultStub || hasTodo) {
    const firstStepLines = targetLines.slice(0, Math.min(3, targetLines.length));
    const petunjukSection = sections['petunjuk'] || sections['aturan'] || '';

    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Analisis Progres Kode Kamu Saat Ini (Tahap 1 dari 3: Memulai Logika)

Saat ini fungsi \`${problem.signatureSummary}\` di editor kamu **masih berupa kerangka awal (starter)** dan belum memiliki logika pemrosesan.

#### Langkah Selanjutnya yang Harus Kamu Ketik Sekarang:
1. **Hapus komentar \`// TODO\`** di dalam fungsi \`${problem.signatureSummary}\`.
2. **Mulai dengan Langkah Pertama (Persiapan & Validasi Input)** tepat di baris pertama fungsi:
\`\`\`dart
${firstStepLines.join('\n') || '// 1. Periksa kondisi input kosong/tidak valid terlebih dahulu'}
\`\`\`
${
  petunjukSection
    ? `\n#### Panduan Alur Berikutnya:\n${petunjukSection}\n`
    : ''
}
3. Setelah mengetik baris pertama di atas, kamu bisa bertanya lagi **"Langkah selanjutnya setelah membuat kode ini apa?"** dan saya akan membimbingmu ke baris berikutnya!`,
      suggestedFollowUps: [
        'Tampilkan jawaban seharusnya beserta penjelasan',
        'Apa saja syarat lulus kasus Saran agar nilai 100%?',
        'Fungsi kode yang saya buat saat ini apa saja?',
      ],
    };
  }

  // Case 2: User wrote `print(...)` inside the solution function instead of `return`
  const hasPrintInSolution = /\bprint\s*\(/.test(solutionPart);
  const hasReturnInSolution = /\breturn\b/.test(solutionPart);
  if (hasPrintInSolution && !hasReturnInSolution && !problem.signatureSummary.startsWith('void ')) {
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Analisis Progres Kode Kamu: Hati-hati, Kamu Menggunakan \`print()\` Bukan \`return\`!

Saya melihat di dalam fungsi utama kamu sudah menulis logika, tetapi kamu memakai \`print(...)\` dan belum mengembalikan nilai dengan \`return\`.

#### Apa Langkah Selanjutnya?
1. **Ganti \`print(hasil)\` di dalam fungsi utama menjadi \`return hasil;\`**:
   - Kontrak fungsi ini adalah \`${problem.signatureSummary}\`, artinya fungsi wajib **mengembalikan nilai (\`return\`)**, bukan sekadar menampilkannya ke layar.
   - Fungsi \`print()\` cukup dipakai di dalam blok \`void main()\` di bawah untuk melihat hasil uji coba.
2. Setelah menggantinya dengan \`return\`, tekan tombol **Nilai Jawaban (Ctrl+Shift+Enter)** untuk menguji apakah semua test sudah hijau!`,
      suggestedFollowUps: [
        'Apa bedanya print() di void main dengan return di fungsi utama?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
        'Cek kenapa kode saya salah / belum lulus',
      ],
    };
  }

  // Case 3: Compare user's activeBodyLines with targetLines to find what they've done and what's next
  const userWrittenSummary = activeBodyLines
    .slice(0, 6)
    .map((l, idx) => `${idx + 1}. \`${l}\` — ${explainSingleDartLine(l)}`)
    .join('\n');

  // Check missing edge-case / validation checks
  const missingChecks: string[] = [];
  if (
    sol.code.includes('.trim()') &&
    !solutionPart.includes('.trim()')
  ) {
    missingChecks.push(
      'Tambahkan `.trim()` pada input `String` untuk membuang spasi berlebih di awal/akhir.'
    );
  }
  if (
    sol.code.includes('.isEmpty') &&
    !solutionPart.includes('.isEmpty')
  ) {
    missingChecks.push(
      'Tambahkan pengecekan `if (...isEmpty)` untuk menangani kasus masukan kosong (syarat lulus kasus **Saran**).'
    );
  }
  if (
    sol.code.includes('.clamp(') &&
    !solutionPart.includes('.clamp(')
  ) {
    missingChecks.push(
      'Jepit nilai angka menggunakan `.clamp(0, 100)` sebelum dihitung agar nilai di luar batas tetap aman.'
    );
  }
  if (
    sol.code.includes('throw ') &&
    !solutionPart.includes('throw ')
  ) {
    missingChecks.push(
      'Tambahkan pelemparan eksepsi (`throw ArgumentError(...)` / `throw FormatException(...)` / `throw StateError(...)`) untuk menolak input tidak sah sesuai kontrak soal.'
    );
  }

  // Find lines in targetLines that the user hasn't written yet
  const remainingTargetLines = targetLines.filter(
    (tl) =>
      !activeBodyLines.some(
        (ul) =>
          ul.replace(/\s+/g, '') === tl.replace(/\s+/g, '')
      )
  );

  const saranHints = testHints
    .filter((t) => t.kind === 'saran')
    .flatMap((t) => t.reasons);

  return {
    id: `dosen-${Date.now()}`,
    sender: 'dosen',
    timestamp: getNowTime(),
    text: `### Analisis Progres & Langkah Selanjutnya untuk Soal ${problem.id}

#### 1. Apa yang Sudah Kamu Buat di Editor Saat Ini:
Kamu sudah menulis **${activeBodyLines.length} baris logika aktif** di dalam fungsi utama:
${userWrittenSummary}

#### 2. Langkah Selanjutnya Setelah Kode Ini:
${
  missingChecks.length > 0
    ? `Agar kode kamu sempurna (100%), lengkapi tahapan berikut:\n` +
      missingChecks.map((m, i) => `${i + 1}. ${m}`).join('\n')
    : remainingTargetLines.length > 0 && sol.isExact
      ? `Periksa apakah logika kamu sudah mencakup langkah penyelesaian berikut:\n\`\`\`dart\n${remainingTargetLines.slice(0, 6).join('\n')}\n\`\`\``
      : `Logika utama di fungsi kamu sudah terstruktur dengan baik!`
}
${
  saranHints.length > 0
    ? `\n#### 3. Pastikan Syarat Kasus Saran (Penentu Nilai 100%) Sudah Tertangani:\n` +
      saranHints.slice(0, 3).map((r) => `- ${r}`).join('\n')
    : ''
}

#### 4. Tindakan Berikutnya di Editor:
1. Tekan tombol **Jalankan (void main)** (\`Ctrl+Enter\`) di atas untuk melihat hasil \`print()\` dan membaca penjelasan otomatis outputnya di panel bawah.
2. Tekan tombol **Nilai Jawaban** (\`Ctrl+Shift+Enter\`) untuk memverifikasi apakah seluruh **${problem.tests.length} unit test** sudah centang hijau!`,
    suggestedFollowUps: [
      'Cek kenapa kode saya salah / belum lulus',
      'Fungsi kode yang saya buat saat ini apa saja?',
      'Tampilkan jawaban seharusnya beserta penjelasan',
    ],
  };
}

/**
 * Feature 2: Specific Code Snippet & Line-by-Line Dissector
 * Answers:
 * - "Fungsi kode ini apa?" / "Jelaskan kode yang saya buat"
 * - "Apakah kode ini hanya menampilkan teks atau mengembalikan nilai?"
 * - "Fungsi `...` apa?" / "Baris ke-3 artinya apa?"
 */
function buildSpecificCodeExplanation(
  rawQuestion: string,
  problem: EnhancedProblem,
  userCode: string
): DosenMessage {
  const q = rawQuestion.trim();
  const qLower = q.toLowerCase();
  const { solutionPart, mainPart } = splitUserSolutionAndMain(userCode);

  // Check if user asks specifically about print vs return / "hanya menampilkan"
  if (
    (qLower.includes('hanya menampilkan') ||
      qLower.includes('cuma menampilkan') ||
      qLower.includes('cuma nampilin') ||
      (qLower.includes('menampilkan') && qLower.includes('return')) ||
      (qLower.includes('print') && qLower.includes('return')))
  ) {
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Apakah Kode Ini Hanya Menampilkan Teks atau Mengembalikan Nilai (\`return\`)?

Di editor kamu terdapat **dua bagian kode yang memiliki tugas berbeda**:

#### 1. Fungsi Utama \`${problem.signatureSummary}\` (Di Bagian Atas Editor)
- **Tugasnya: Memproses & Mengembalikan Nilai (\`return\`), BUKAN sekadar menampilkan!**
- Fungsi ini menerima input parameter, mengolahnya, lalu **wajib diakhiri dengan \`return hasil;\`**.
- Saat kamu menekan tombol **Nilai Jawaban**, sistem penguji otomatis memanggil fungsi ini dan memeriksa nilai yang di-\`return\`. Jika kamu hanya menulis \`print()\` di dalam fungsi ini tanpa \`return\`, maka nilai kembaliannya kosong/\`null\` dan pengujian akan gagal.

#### 2. Blok \`void main()\` (Di Bagian Bawah Editor)
- **Tugasnya: Hanya Menampilkan Hasil ke Layar Output (\`print\`) untuk Uji Coba Mandiri.**
- Baris \`print(...)\` di dalam \`void main()\` memanggil fungsi utamamu lalu **menampilkan hasilnya ke panel Output di bawah** saat kamu menekan tombol **Jalankan (void main)**.

\`\`\`dart
// BAGIAN 1: Mengembalikan nilai (Dinilai oleh sistem unit test)
String contohFungsi(String input) {
  return 'Hasil: \$input'; // <-- WAJIB pakai return
}

// BAGIAN 2: Hanya menampilkan ke layar konsol saat klik "Jalankan"
void main() {
  print(contohFungsi('Tes')); // <-- Menampilkan 'Hasil: Tes' ke layar
}
\`\`\``,
      suggestedFollowUps: [
        'Fungsi kode yang saya buat saat ini apa saja?',
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
      ],
    };
  }

  // Check if user asks about a specific line number, e.g. "baris 3", "baris ke-4"
  const lineNumMatch = qLower.match(/baris\s+(?:ke[-\s]*)?(\d+)/);
  if (lineNumMatch) {
    const lineIdx = parseInt(lineNumMatch[1], 10);
    const allLines = userCode.replace(/\r\n/g, '\n').split('\n');
    if (lineIdx >= 1 && lineIdx <= allLines.length) {
      const targetLine = allLines[lineIdx - 1];
      return {
        id: `dosen-${Date.now()}`,
        sender: 'dosen',
        timestamp: getNowTime(),
        text: `### Bedah Kode Baris ke-${lineIdx} di Editor Kamu

\`\`\`dart
${targetLine}
\`\`\`

- ${explainSingleDartLine(targetLine, lineIdx)}`,
        suggestedFollowUps: [
          'Fungsi kode yang saya buat saat ini apa saja?',
          'Langkah selanjutnya setelah membuat kode ini apa?',
          'Tampilkan jawaban seharusnya beserta penjelasan',
        ],
      };
    }
  }

  // Check if user included a specific backticked code snippet or Dart expression in their question
  const backtickMatch = q.match(/`([^`]+)`/);
  const quotedMatch = q.match(/['"]([^'"]+)['"]/);
  const explicitSnippet = backtickMatch?.[1] || quotedMatch?.[1] || null;

  if (explicitSnippet && explicitSnippet.trim().length >= 2) {
    const cleanSnippet = explicitSnippet.trim();
    // Match against problem.codelineExplanations first
    const matchedCodeline = problem.codelineExplanations.find(
      (c) =>
        c.token.toLowerCase() === cleanSnippet.toLowerCase() ||
        cleanSnippet.toLowerCase().includes(c.token.toLowerCase().replace(/[().]/g, ''))
    );

    const lineExplanation = explainSingleDartLine(cleanSnippet);

    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Penjelasan Spesifik untuk Kode: \`${cleanSnippet}\`

- **Fungsi Langsung pada Baris Kode:**
  ${lineExplanation}
${
  matchedCodeline
    ? `\n- **Detail Sintaks \`${matchedCodeline.token}\` (${matchedCodeline.category}):**\n  **${matchedCodeline.summary}** — ${matchedCodeline.detail}\n\n\`\`\`dart\n${matchedCodeline.exampleCode}\n\`\`\`\n*Tips Mengingat:* ${matchedCodeline.memoryTip}`
    : ''
}`,
      suggestedFollowUps: [
        'Fungsi kode yang saya buat saat ini apa saja?',
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
      ],
    };
  }

  // Otherwise: Dissect EVERY line currently in the user's editor (`solutionPart` + `mainPart`)!
  const solLines = solutionPart
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('///'));

  const mainLines = mainPart
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//'));

  const solBreakdown = solLines
    .map((line, i) => `- ${explainSingleDartLine(line, i + 1)}`)
    .join('\n');

  const mainBreakdown = mainLines
    .slice(0, 6)
    .map((line) => `- ${explainSingleDartLine(line)}`)
    .join('\n');

  return {
    id: `dosen-${Date.now()}`,
    sender: 'dosen',
    timestamp: getNowTime(),
    text: `### Bedah Lengkap Fungsi Tiap Baris Kode di Editor Kamu (${problem.id})

Berikut penjelasan baris demi baris dari kode yang sedang ada di editor kamu saat ini:

#### A. Bagian Fungsi Jawaban Utama (\`${problem.signatureSummary}\`)
*Bagian ini bertugas mengolah input dan **mengembalikan nilai (\`return\`)** untuk dinilai oleh unit test:*
${solBreakdown || '- *(Belum ada baris kode di fungsi utama)*'}

#### B. Bagian Blok Pengujian \`void main()\` di Bawah
*Bagian ini bertugas memanggil fungsi di atas dan **menampilkan hasilnya ke layar konsol (\`print\`)** saat tombol **Jalankan** ditekan:*
${mainBreakdown || '- *(Blok void main() belum dipasang)*'}

> **Tips:** Kamu juga bisa menanyakan potongan kode spesifik dengan mengetik misalnya: *"Apa fungsi \`final bersih = nama.trim()\`?"* atau *"Jelaskan baris ke-3"*.`,
    suggestedFollowUps: [
      'Apakah kode ini hanya menampilkan teks atau mengembalikan nilai (return)?',
      'Langkah selanjutnya setelah membuat kode ini apa?',
      'Jelaskan semua sintaks & method penting di soal ini',
    ],
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

Pada soal ini, kamu diminta melengkapi kontrak \`${problem.signatureSummary}\` untuk lulus **${wajibCount} pengujian Wajib** dan **${saranCount} pengujian Saran**.

Kamu bebas menanyakan **apa saja** seputar soal ini, misalnya:
- **"Langkah selanjutnya setelah membuat kode ini apa?"** *(saya akan memeriksa baris kode yang sudah kamu ketik dan memberi tahu langkah berikutnya)*
- **"Fungsi kode yang saya buat saat ini apa saja?"** atau **"Apakah kode ini hanya menampilkan atau mengembalikan nilai?"**
- **"Cek kenapa kode saya salah"** atau **"Apa syarat lulus kasus Saran 100%?"**
- **"Tampilkan jawaban seharusnya"** beserta penjelasan baris demi baris`,
    suggestedFollowUps: DOSEN_QUICK_PROMPTS,
  };
}

/**
 * Built-in dictionary of common Dart keywords/methods/operators for comprehensive lookup.
 */
const EXTRA_DART_DICTIONARY: Record<
  string,
  { title: string; body: string; example: string }
> = {
  final: {
    title: '`final` — Variabel Satu Kali Isi (Immutable Reference)',
    body: 'Kata kunci `final` digunakan untuk mendeklarasikan variabel yang nilainya hanya diatur **satu kali** saat program berjalan dan tidak bisa diubah lagi setelahnya. Variabel `final` menyimpan data di memori (tidak otomatis menampilkan ke layar kecuali dipanggil di dalam `print()`).',
    example: `final namaBersih = nama.trim();\n// namaBersih = 'lain'; // ERROR: variabel final tidak bisa diubah`,
  },
  var: {
    title: '`var` — Variabel yang Nilainya Bisa Berubah (Mutable)',
    body: 'Kata kunci `var` meminta Dart menebak tipe data secara otomatis dan mengizinkan nilainya diubah kembali nanti (misalnya penghitung `total` atau `maks` di dalam perulangan `for`).',
    example: `var total = 0;\nfor (final n in angka) {\n  total += n;\n}`,
  },
  const: {
    title: '`const` — Konstanta Waktu Kompilasi (Compile-time Constant)',
    body: 'Digunakan untuk nilai tetap yang sudah pasti diketahui sebelum program dijalankan, seperti batas maksimum atau objek konstan.',
    example: `const batasMaksimum = 100;`,
  },
  return: {
    title: '`return` — Mengembalikan Nilai Hasil Fungsi',
    body: '`return` mengirimkan nilai hasil olahan fungsi kembali ke pemanggil (dan ke sistem penilai unit test), lalu langsung menghentikan eksekusi fungsi. Berbeda dengan `print()` yang hanya mencetak teks ke konsol.',
    example: `int tambah(int a, int b) {\n  return a + b; // Mengembalikan hasil penjumlahan\n}`,
  },
  print: {
    title: '`print(...)` — Menampilkan Nilai ke Konsol Output',
    body: '`print()` hanya menampilkan teks ke panel Output saat kamu menekan tombol **Jalankan (`void main`)**. `print()` tidak mengirimkan nilai ke unit test, jadi di dalam fungsi jawaban utama tetap wajib memakai `return`.',
    example: `void main() {\n  print(sapa('Ayu')); // Menampilkan hasil ke layar Output\n}`,
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
    body: 'Merangkum seluruh isi `List`/`Iterable` menjadi satu nilai akhir (misalnya menjumlahkan angka) dengan nilai awal yang aman meskipun list kosong.',
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
    example: `['a', 'b', 'c'].join(', '); // 'a, b, c'`,
  },
  clamp: {
    title: '`.clamp(bawah, atas)` — Pembatas Rentang Angka',
    body: 'Memastikan angka tidak lebih kecil dari batas bawah dan tidak lebih besar dari batas atas.',
    example: `final nilaiAman = nilai.clamp(0, 100).toDouble();`,
  },
  tostringasfixed: {
    title: '`.toStringAsFixed(n)` — Format Angka Desimal',
    body: 'Mengubah `double` menjadi teks dengan tepat `n` angka di belakang koma. Gunakan `double.parse(nilai.toStringAsFixed(2))` jika tipe kembalian fungsi adalah `double`.',
    example: `final hasil = double.parse((10 / 3).toStringAsFixed(2)); // 3.33`,
  },
  async: {
    title: '`async`, `await`, & `Future.wait` — Pemrograman Asinkron',
    body: 'Tandai fungsi dengan `async` ketika mengembalikan `Future<T>`, gunakan `await` untuk menunggu satu `Future`, atau `await Future.wait(daftarFuture)` untuk menjalankan banyak `Future` secara paralel (bersamaan).',
    example: `Future<List<String>> ambilSemua(List<String> id, Future<String> Function(String) ambil) async {\n  return await Future.wait(id.map(ambil));\n}`,
  },
  try: {
    title: '`try / catch / throw` — Penanganan Eksepsi & Error',
    body: 'Gunakan `throw ArgumentError(...)`, `throw FormatException(...)`, atau `throw StateError(...)` untuk menolak input tidak valid, dan gunakan blok `try { ... } catch (e) { ... }` untuk menangkap error agar program tidak berhenti mendadak.',
    example: `if (b == 0) {\n  throw ArgumentError('Pembagi tidak boleh nol');\n}`,
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
  const { solutionPart, activeBodyLines } = splitUserSolutionAndMain(userCode);

  const stillHasTodo = /\/\/\s*TODO/i.test(solutionPart);
  const hasReturn = /\breturn\b/.test(solutionPart);

  parts.push(`### Diagnosis Kode Kamu untuk Soal ${problem.id}`);

  if (stillHasTodo && activeBodyLines.length <= 1) {
    parts.push(
      `Saat ini bagian fungsi utama \`${problem.signatureSummary}\` di editor kamu **masih berupa template starter (\`// TODO\`)**.\n\n` +
        `**Langkah perbaikan:**\n` +
        `1. Hapus baris \`// TODO\` di dalam fungsi di atas \`void main()\`.\n` +
        `2. Tambahkan validasi input untuk menangani kasus batas (**Saran**) di baris paling awal fungsi.\n` +
        `3. Tulis perhitungan/logika utama lalu akhiri dengan \`return ...;\`.\n` +
        `4. Klik **"Langkah selanjutnya setelah membuat kode ini apa?"** atau **"Tampilkan jawaban seharusnya"** di bawah jika butuh contoh kodenya.`
    );
  }

  if (execState.kind === 'compile-error') {
    parts.push(`#### Ditemukan Error Kompilasi (${execState.errors.length} lokasi)`);
    execState.errors.slice(0, 4).forEach((err) => {
      parts.push(
        `- **Baris ${err.line}, Kolom ${err.column}:** \`${err.message}\`\n  *Cara Memperbaiki:* Periksa tanda titik koma \`;\`, kurung kurawal \`{}\`, nama variabel yang belum dideklarasikan, atau ketidakcocokan tipe nilai \`return\`.`
      );
    });
  } else if (execState.kind === 'submit') {
    const allResults = execState.result.results;
    const failedResults = allResults.filter((r) => r.status !== 'pass');
    const passedCount = allResults.length - failedResults.length;

    if (failedResults.length === 0 && allResults.length > 0) {
      parts.push(
        `Luar biasa! Seluruh **${passedCount}/${allResults.length} unit test (Wajib & Saran)** sudah **LULUS 100%**! Tidak ada kesalahan pada kode kamu.`
      );
    } else {
      parts.push(
        `Hasil penilaian terakhir: **${passedCount} Lulus**, **${failedResults.length} Belum Lulus**. Berikut penyebab spesifik dan cara memperbaikinya:`
      );
      for (const fail of failedResults) {
        const hint = testHints.find((h) => h.name === fail.name);
        const kindLabel =
          hint?.kind === 'saran' ? 'Kasus Saran (Penentu 100%)' : 'Kasus Wajib';
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
        `#### Runtime Error saat Menjalankan \`void main()\`\n- Pesan: \`${execState.result.jsError}\`\n- *Solusi:* Pastikan tidak ada pembagian bulat dengan nol (\`~/ 0\`), akses indeks di luar batas \`List\`, atau eksepsi yang belum ditangani.`
      );
    } else {
      const lines = execState.result.stdout.filter((l) => l.trim().length > 0);
      parts.push(
        `Eksekusi \`void main()\` berhasil menghasilkan **${lines.length} baris output** (\`${lines.slice(0, 3).join(', ')}\`).\n\n` +
          `> **Penting:** Berhasil di \`void main()\` baru menguji contoh di dalam \`main()\`. Sekarang tekan tombol **Nilai Jawaban (Ctrl+Shift+Enter)** agar seluruh **${problem.tests.length} unit test Wajib & Saran** diperiksa oleh sistem!`
      );
    }
  } else if (!stillHasTodo || activeBodyLines.length > 1) {
    const sol = getOrSynthesizeSolution(problem);
    const staticTips: string[] = [];
    if (!hasReturn && !problem.signatureSummary.startsWith('void ')) {
      staticTips.push(
        'Fungsi kamu belum memiliki pernyataan `return`. Pastikan mengembalikan nilai sesuai tipe kontrak fungsi.'
      );
    }
    if (sol.code.includes('.trim()') && !solutionPart.includes('.trim()')) {
      staticTips.push(
        'Kode kamu belum memanggil `.trim()`. Tambahkan `.trim()` agar input dengan spasi berlebih di ujung tetap lulus.'
      );
    }
    if (sol.code.includes('.isEmpty') && !solutionPart.includes('.isEmpty')) {
      staticTips.push(
        'Tambahkan pengecekan `.isEmpty` untuk menangani kasus masukan kosong pada pengujian **Saran**.'
      );
    }
    if (staticTips.length > 0) {
      parts.push(
        `#### Hasil Pemeriksaan Baris Kode Kamu Saat Ini:\n` +
          staticTips.map((t) => `- ${t}`).join('\n')
      );
    } else {
      parts.push(
        `Struktur kode kamu terlihat sudah terisi (**${activeBodyLines.length} baris aktif**). Tekan tombol **Nilai Jawaban (Ctrl+Shift+Enter)** di toolbar atas agar saya bisa memvalidasi hasil tiap unit test Wajib & Saran secara akurat!`
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

  // 1. Scope guard for completely unrelated non-programming topics
  const offTopicPatterns =
    /\b(resep\s+masak|politik|presiden|pacar|jodoh|ramalan|zodiak|sepak\s*bola|skor\s+bola|film\s+bioskop|cuaca\s+hari\s+ini|gosip)\b/i;
  if (offTopicPatterns.test(q) && !q.includes('dart') && !q.includes('soal') && !q.includes('kode')) {
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `Halo! Saya **Dosen Pintar Dart** yang fokus membimbing kamu menaklukkan soal-soal pemrograman Dart di platform ini (saat ini aktif pada soal **${problem.id} — ${problem.title}**).\n\nSilakan tanyakan apa saja seputar:\n- **Langkah selanjutnya** setelah kode yang kamu tulis saat ini\n- **Fungsi baris kode** (apakah hanya menampilkan atau mengembalikan nilai)\n- **Penyebab kode error / belum 100%**\n- **Jawaban seharusnya** beserta penjelasan lengkap`,
      suggestedFollowUps: DOSEN_QUICK_PROMPTS,
    };
  }

  // 2. Intent: "Langkah selanjutnya setelah membuat kode ini apa?" / Progress Check
  if (
    q.includes('langkah selanjutnya') ||
    q.includes('selanjutnya apa') ||
    q.includes('habis ini') ||
    q.includes('abis ini') ||
    q.includes('lanjutannya') ||
    q.includes('setelah membuat kode ini') ||
    q.includes('setelah ini') ||
    q.includes('kurang apa') ||
    q.includes('sudah lengkap') ||
    q.includes('step berikutnya') ||
    q.includes('langkah berikutnya') ||
    q.includes('harus nulis apa lagi') ||
    q.includes('apa lagi yang harus')
  ) {
    return buildNextStepGuidance(problem, userCode, execState);
  }

  // 3. Intent: "Apakah kode ini hanya menampilkan atau mengembalikan nilai?" / "print vs return" / "void main benar tapi test gagal"
  if (
    q.includes('hanya menampilkan') ||
    q.includes('cuma menampilkan') ||
    q.includes('cuma nampilin') ||
    (q.includes('print') && q.includes('return')) ||
    (q.includes('menampilkan') && q.includes('mengembalikan')) ||
    (q.includes('void main') && (q.includes('gagal') || q.includes('salah') || q.includes('beda')))
  ) {
    return buildSpecificCodeExplanation(rawQuestion, problem, userCode);
  }

  // 4. Intent: "Fungsi kode ini apa?" / "Jelaskan kode yang saya buat" / "Baris ke-N" / Specific snippet in backticks or quotes
  if (
    q.includes('fungsi kode') ||
    q.includes('kode yang saya buat') ||
    q.includes('kode saya ini') ||
    q.includes('arti kode ini') ||
    q.includes('maksud kode') ||
    q.includes('jelaskan kode saya') ||
    q.includes('bedah kode saya') ||
    /baris\s+(?:ke[-\s]*)?\d+/.test(q) ||
    /`[^`]+`/.test(rawQuestion)
  ) {
    return buildSpecificCodeExplanation(rawQuestion, problem, userCode);
  }

  // 5. Intent: Conceptual Questions / "Jelaskan" section / Complexity (Big-O) / Alternative approach
  if (
    q.includes('bagian jelaskan') ||
    q.includes('pertanyaan konsep') ||
    q.includes('kompleksitas') ||
    q.includes('big-o') ||
    q.includes('big o') ||
    q.includes('cara lain') ||
    q.includes('alternatif') ||
    q.includes('kenapa cara naif')
  ) {
    const jelaskanSection = sections['jelaskan'] || '';
    const petunjukSection = sections['petunjuk'] || '';
    const sol = getOrSynthesizeSolution(problem);

    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Pembahasan Konsep, Kompleksitas & Alternatif Algoritma (${problem.id})

${
  jelaskanSection
    ? `#### Pembahasan Bagian "Jelaskan" & Efisiensi Algoritma:\n${jelaskanSection}\n\n`
    : ''
}#### Mengapa Pendekatan Ini Dipilih?
${
  petunjukSection
    ? petunjukSection
    : sol.explanation
}

#### Apakah Boleh Memakai Cara / Sintaks Alternatif?
Boleh! Di Dart, selama fungsi \`${problem.signatureSummary}\` mengembalikan nilai yang tepat untuk seluruh kasus **Wajib** dan **Saran** serta selesai sebelum batas waktu (*timeout* ${problem.timeoutMs / 1000} detik), kamu bebas memakai:
- Perulangan \`for\` / \`while\` klasik maupun method fungsional koleksi (\`.where()\`, \`.map()\`, \`.fold()\`).
- Percabangan \`if / else\` biasa, operator ternary \`? :\`, maupun \`switch\` expression Dart 3.`,
      suggestedFollowUps: [
        'Tampilkan jawaban seharusnya beserta penjelasan',
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Apa saja syarat lulus kasus Saran agar nilai 100%?',
      ],
    };
  }

  // 6. Intent: Input-Output Simulation / Examples ("Simulasikan contoh input dan output")
  if (
    q.includes('simulasi') ||
    q.includes('contoh input') ||
    q.includes('contoh output') ||
    q.includes('cara kerja contoh') ||
    q.includes('tabel contoh')
  ) {
    const soalSection =
      sections['soal'] || sections['contoh'] || sections['kontrak'] || '';
    const sampleExpects = testHints.flatMap((t) => t.sampleExpects);

    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Simulasi Input & Output pada Soal ${problem.id} (${problem.title})

Kontrak fungsi yang dipanggil adalah:
\`\`\`dart
${problem.signatureSummary}
\`\`\`

${soalSection ? `#### Spesifikasi & Tabel Contoh dari Soal:\n${soalSection}\n` : ''}
${
  sampleExpects.length > 0
    ? `#### Simulasi Pemanggilan di Unit Test:\n\`\`\`dart\n${sampleExpects.slice(0, 6).join('\n')}\n\`\`\``
    : ''
}

#### Bagaimana Cara Mengujinya Sendiri?
Lihat bagian paling bawah editor pada blok \`void main()\`. Setiap baris \`print(...)\` di sana memanggil fungsi kamu dengan input contoh di atas, lalu menampilkan keluarannya di panel **Output** saat kamu menekan **Jalankan (void main)**.`,
      suggestedFollowUps: [
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
        'Bagaimana cara menambah pengujian sendiri di void main()?',
      ],
    };
  }

  // 7. Intent: How to use / add tests in `void main()`
  if (
    q.includes('void main') ||
    q.includes('tambah pengujian') ||
    q.includes('ngetes sendiri') ||
    q.includes('cara testing') ||
    q.includes('cara uji')
  ) {
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: `### Cara Menggunakan & Menambah Pengujian di \`void main()\` (${problem.id})

Di bagian bawah kode jawabanmu, sudah tersedia blok \`void main()\`:

\`\`\`dart
${problem.mainTestBlock}
\`\`\`

#### Fungsi & Cara Pakainya:
1. **Menjalankan Uji Coba Manual**: Tekan tombol **Jalankan (void main)** atau \`Ctrl+Enter\`. Fungsi \`void main()\` akan dieksekusi dan hasil setiap \`print(...)\` akan muncul di panel bawah lengkap dengan analisis otomatis.
2. **Menambah Kasus Uji Sendiri**: Kamu bebas menambahkan baris \`print(...)\` baru di dalam kurung kurawal \`void main() { ... }\` untuk mencoba input ekstrem (misalnya teks kosong \`''\`, angka \`0\`, atau angka negatif).
3. **Aman Saat Dinilai**: Ketika kamu menekan tombol **Nilai Jawaban**, sistem *Smart Combiner* otomatis memisahkan \`void main()\` kamu sehingga **tidak akan pernah bentrok** dengan unit test resmi!`,
      suggestedFollowUps: [
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Apa bedanya print() di void main dengan return di fungsi utama?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
      ],
    };
  }

  // 8. Intent: Reference Solution / Jawaban Seharusnya
  if (
    q.includes('jawaban') ||
    q.includes('solusi') ||
    q.includes('kunci') ||
    q.includes('seharusnya') ||
    q.includes('contoh kode lengkap') ||
    q.includes('kode benar') ||
    q.includes('answer') ||
    q.includes('solution') ||
    q.includes('bocoran kode')
  ) {
    const sol = getOrSynthesizeSolution(problem);
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      solutionCode: sol.code,
      text: `Berikut adalah **${
        sol.isExact
          ? 'Jawaban Referensi Lengkap (Lulus 100%)'
          : 'Implementasi Referensi & Panduan Lengkap'
      }** untuk soal **${problem.id} — ${problem.title}**:

\`\`\`dart
${sol.code}
\`\`\`

### Penjelasan Alur Kode Baris demi Baris:
${sol.explanation}

> **Cara Pakai:** Klik tombol **"Pasang Jawaban ke Editor"** di bawah pesan ini untuk langsung menerapkan kode di atas ke editor (blok \`void main()\` kamu tetap dipertahankan), lalu tekan **Jalankan** atau **Nilai Jawaban**.`,
      suggestedFollowUps: [
        'Fungsi kode yang saya buat saat ini apa saja?',
        'Apa saja syarat lulus kasus Saran agar nilai 100%?',
        'Apa jawaban pertanyaan konsep / bagian Jelaskan di soal ini?',
      ],
    };
  }

  // 9. Intent: Debug / Check User Code ("Cek kenapa kode saya salah")
  if (
    q.includes('cek') ||
    q.includes('salah') ||
    q.includes('error') ||
    q.includes('gagal') ||
    q.includes('belum lulus') ||
    q.includes('perbaiki') ||
    q.includes('debug') ||
    q.includes('merah') ||
    q.includes('koreksi') ||
    q.includes('kenapa belum')
  ) {
    const diagnosis = buildCodeDiagnosis(problem, userCode, execState);
    return {
      id: `dosen-${Date.now()}`,
      sender: 'dosen',
      timestamp: getNowTime(),
      text: diagnosis,
      suggestedFollowUps: [
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
        'Apa saja syarat lulus kasus Saran agar nilai 100%?',
      ],
    };
  }

  // 10. Intent: Edge Cases / Kasus Saran (100% Score)
  if (
    q.includes('saran') ||
    q.includes('100%') ||
    q.includes('100 poin') ||
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
      text: `### Rincian Syarat Lulus Unit Test Soal ${problem.id} (Wajib & Saran 100%)

Agar mendapatkan nilai **100 poin penuh**, kode kamu harus lulus pengujian **Wajib** (skenario utama) dan **Saran** (validasi input & kasus batas):

#### 1. Pengujian Wajib (Kasus Utama)
${wajibList || '- Menguji alur utama fungsi sesuai kontrak soal.'}

#### 2. Pengujian Saran (Kasus Batas / Penentu Nilai 100%)
${saranList || '- Menguji input kosong, nol, negatif, atau performa data besar.'}

> **Tips Dosen:** Selalu letakkan pengecekan kasus **Saran** (misalnya \`if (teks.trim().isEmpty)\` atau \`if (n <= 0)\`) di **baris paling atas fungsi** sebelum melakukan perhitungan utama.`,
      suggestedFollowUps: [
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
        'Cek kenapa kode saya salah / belum lulus',
      ],
    };
  }

  // 11. Intent: Specific Keyword / Syntax / Method Explanation
  const matchedCodelines = problem.codelineExplanations.filter((item) => {
    const cleanToken = item.token.toLowerCase().replace(/[().]/g, '');
    return (
      cleanToken.length >= 2 &&
      (q.includes(cleanToken) || q.includes(item.token.toLowerCase()))
    );
  });

  const matchedExtraKeys = Object.keys(EXTRA_DART_DICTIONARY).filter((key) =>
    new RegExp(`\\b${key}\\b`, 'i').test(q)
  );

  if (
    matchedCodelines.length > 0 ||
    matchedExtraKeys.length > 0 ||
    q.includes('sintaks') ||
    q.includes('apa itu') ||
    q.includes('jelaskan') ||
    q.includes('arti ') ||
    q.includes('maksud ') ||
    q.includes('kegunaan') ||
    q.includes('bedanya')
  ) {
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
      matchedExtraKeys.length > 0
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
      text: `### Penjelasan Fungsi & Sintaks Kode untuk Pertanyaan: *"${rawQuestion.trim()}"*

${extraFormatted ? extraFormatted + '\n\n' : ''}${formattedItems}`,
      suggestedFollowUps: [
        'Fungsi kode yang saya buat saat ini apa saja?',
        'Langkah selanjutnya setelah membuat kode ini apa?',
        'Tampilkan jawaban seharusnya beserta penjelasan',
      ],
    };
  }

  // 12. Default / How to solve from scratch + Direct response to user's custom question
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
    text: `### Panduan Menjawab Pertanyaanmu pada Soal ${problem.id} (${problem.title})

Menjawab pertanyaanmu (*"${rawQuestion.trim()}"*):

#### 1. Kontrak Fungsi yang Harus Dibuat
Lengkapi deklarasi berikut di bagian atas editor:
\`\`\`dart
${problem.signatureSummary}
\`\`\`
${soalSection ? `\n${soalSection}\n` : ''}
${aturanSection ? `#### 2. Aturan & Syarat yang Wajib Dipenuhi\n${aturanSection}\n` : ''}
${
  petunjukSection
    ? `#### 3. Tahapan Algoritma (Step-by-Step)\n${petunjukSection}\n`
    : allReasons.length > 0
      ? `#### 3. Tahapan Algoritma (Step-by-Step)\n${allReasons
          .map((r, i) => `${i + 1}. ${r}`)
          .join('\n')}\n`
      : ''
}
#### 4. Apa yang Perlu Kamu Lakukan Sekarang?
- Klik **"Langkah selanjutnya setelah membuat kode ini apa?"** di bawah agar saya memeriksa baris kode yang sudah kamu ketik dan memberi tahu potongan kode berikutnya.
- Atau klik **"Tampilkan jawaban seharusnya beserta penjelasan"** jika ingin langsung melihat referensi kode lengkapnya.`,
    suggestedFollowUps: [
      'Langkah selanjutnya setelah membuat kode ini apa?',
      'Fungsi kode yang saya buat saat ini apa saja?',
      'Tampilkan jawaban seharusnya beserta penjelasan',
      'Apa saja syarat lulus kasus Saran agar nilai 100%?',
    ],
  };
}
