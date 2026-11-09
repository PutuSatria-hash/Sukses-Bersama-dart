# Sukses Bersama Dart — Edisi Interaktif 2.0

Platform latihan dan pembelajaran bahasa pemrograman **Dart** interaktif dengan **180 tantangan terstruktur** (60 Easy, 60 Medium, 60 Hard).

## Pembaruan & Fitur Unggulan (Versi 2.0)

1. **Codeline Testing (`void main()`) Otomatis di Seluruh 180 Soal**:
   - Setiap soal dilengkapi blok fungsi `void main()` (atau `Future<void> main() async`) siap jalan yang menguji fungsi/class soal dengan data sampel nyata dan mencetak perbandingan `Hasil` vs `Ekspektasi`.
   - Tombol **Jalankan (`Ctrl+Enter`)** selalu aktif untuk mengeksekusi `void main()` dan memvalidasi kecocokan baris output secara visual.
2. **Smart Code Combiner (Bebas Bentrok Saat Menilai)**:
   - Saat menekan tombol **Nilai (`Ctrl+Shift+Enter`)**, penggabung kode secara otomatis memetakan `main()` milik pengguna menjadi `_userMain()` tanpa menggeser nomor baris kode, sehingga tidak pernah bentrok dengan *unit test runner*.
3. **Panduan Pembuatan `void main()` Langkah demi Langkah**:
   - Tab khusus **Cara Buat `void main()`** di samping kanan setiap soal yang mengajarkan 4 langkah menyusun fungsi testing sendiri untuk soal tersebut, lengkap dengan tombol **Pasang / Reset `void main()`**.
4. **Panel Bedah Baris Kode & Kamus Sintaks Kontekstual**:
   - Menjelaskan fungsi setiap baris kode dan sintaks yang dipakai pada masing-masing soal (`final`, `var`, `return`, `String`, `$interpolasi`, `.trim()`, `.isEmpty`, `.where()`, `.map()`, `.fold()`, `async/await`, `Future`, `class`, `null-safety`, dll.) beserta contoh penerapan dan tips mengingat cepat.

## Cara Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

## Build untuk Produksi / Vercel

```bash
npm run build
```

