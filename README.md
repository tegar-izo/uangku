# 💰 Uangku - Money Manager

Aplikasi manajemen keuangan personal yang sederhana, cepat, dan elegant berbasis web. Uangku membantu Anda melacak pemasukan dan pengeluaran dengan antarmuka yang intuitif dan responsif. **Sepenuhnya berjalan di sisi klien (browser) tanpa memerlukan backend atau server!**

## ✨ Fitur Utama

- 📊 **Catat Transaksi** - Mudah mencatat pemasukan dan pengeluaran dengan deskripsi
- 💾 **Menyimpan Data Lokal** - Data tersimpan aman di browser Anda menggunakan localStorage
- 🎨 **Mode Tema Gelap/Terang** - Beralih antara tema cerah dan gelap sesuai preferensi
- 📥 **Import/Export Data** - Ekspor data transaksi sebagai JSON dan impor kembali kapan saja
- 🧭 **Navigasi Tiga Tab** - Beranda, Riwayat, dan Pengaturan dalam navbar pil mengambang; tab aktif tersimpan di URL (`#/beranda`, `#/riwayat`, `#/pengaturan`)
- 📱 **Responsive Design** - Bekerja sempurna di desktop, tablet, dan mobile
- 🧾 **Riwayat Bertahap** - Riwayat dimuat 40 baris per halaman dan ditambah otomatis saat digulir, jadi tetap ringan walau datanya ribuan
- 📅 **Ringkasan Harian** - Beranda menampilkan transaksi hari ini saja, dengan tautan cepat ke seluruh riwayat
- ⚡ **Ringan & Cepat** - Tanpa request ke pihak ketiga; animasi memakai transisi CSS dan ikon berupa sprite SVG inline
- 🚀 **Client-Side Only** - Tidak perlu khawatir tentang privacy, semua data hanya ada di device Anda

## 📁 Struktur Folder

```
uangku/
├── index.html          # File HTML utama + sprite ikon SVG inline
├── script.js           # Logika aplikasi (transaksi, tema, animasi overlay)
├── style.css           # Gaya CSS global dan layout
├── theme.css           # Token warna tema gelap & terang (hijau neon + kaca)
├── sw.js               # Service worker untuk akses offline
├── manifest.json       # Metadata PWA
├── icon-192.png        # Ikon PWA 192px
└── icon-512.png        # Ikon PWA 512px
```

## 🚀 Cara Menggunakan

### Metode 1: Buka File HTML Langsung
1. Klon atau download repositori:
   ```bash
   git clone https://github.com/dayxnight/uangku.git
   cd uangku
   ```
2. Buka file `index.html` di browser favorit Anda (Chrome, Firefox, Edge, Safari, dll)

### Metode 2: Akses Online
Atau akses aplikasi melalui GitHub Pages:
🔗 **https://tegar-izo.github.io/uangku/**

## 💡 Cara Kerja

### Berpindah Tab
Navbar pil di bagian bawah layar berisi tiga tab:
- **Beranda** - saldo, daftar dompet, tombol aksi, dan transaksi hari ini
- **Riwayat** - seluruh transaksi dengan filter dompet dan tanggal
- **Pengaturan** - export/import, kelola dompet, tema, dan hapus data

Tab aktif tercatat di hash URL, jadi tombol *back* browser tetap bekerja dan halaman bertahan pada tab yang sama setelah dimuat ulang.

### Menambah Transaksi
1. Di tab **Beranda**, klik tombol **"masuk"** untuk mencatat pemasukan atau **"keluar"** untuk pengeluaran
2. Pilih dompet tujuan pada dropdown **Dompet**
3. Isi keterangan transaksi (misal: "Gaji Bulanan", "Beli Makanan")
4. Masukkan jumlah nominal dalam Rupiah
5. Klik **"simpan"** untuk menyimpan transaksi

### Melihat Riwayat
- Tab **Beranda** hanya menampilkan transaksi hari ini, lengkap dengan empty state bila belum ada
- Tab **Riwayat** menampilkan semua transaksi, dikelompokkan per tanggal, dengan filter dompet & tanggal
- **Total saldo** otomatis dihitung dari semua transaksi
- Transaksi ditampilkan dengan ikon, deskripsi, dompet, dan nominal

### Mengelola Data (tab Pengaturan)
- 📤 **Export**: Simpan semua data transaksi Anda ke file JSON
- 📥 **Import**: Muat data dari file JSON sebelumnya
- 🎨 **Tema**: Ganti nama dompet, transfer saldo, dan ubah tema dari daftar yang sama

## 🛠️ Teknologi

- **HTML5** - Struktur markup semantik
- **CSS3** - Styling modern dengan CSS variables, glassmorphism, dan pola titik
- **JavaScript (ES6+)** - Logika aplikasi yang responsif
- **SVG sprite inline** - Ikon Material Symbols yang dirangkum di dalam `index.html`
- **localStorage API** - Penyimpanan data lokal di browser

## 📦 Dependensi

Tidak ada dependensi eksternal. Tidak ada CDN, webfont, atau library animasi yang perlu diunduh, sehingga aplikasi tampil seketika dan tetap berfungsi penuh saat offline.

## 💾 Penyimpanan Data

Aplikasi ini menggunakan **browser's localStorage** untuk menyimpan data:
- Data disimpan dalam format JSON dengan key `uangku_data`
- Data tetap ada meskipun browser ditutup
- Anda dapat menghapus data dengan membersihkan browser cache
- **Tips keamanan**: Export data Anda secara berkala sebagai backup!

## 🎨 Desain & Tema

Aplikasi memakai bahasa desain **hijau neon di atas latar gelap** yang terinspirasi dari [portofolio Tegar Izoelhaq](https://tegar-izo.github.io/): pola titik halus, vignette gelap, kartu kaca (glassmorphism) berbingkai tipis, radius besar, dan sorot cahaya hijau saat elemen disentuh.
- **Tema Gelap** (bawaan): latar hijau gelap dengan aksen hijau neon
- **Tema Terang**: versi terang berpalet sama, nyaman untuk siang hari

Kedua tema dapat diubah kapan saja melalui tab **Pengaturan**.

## 🔄 Pembaruan & Versi Cache

`sw.js` memakai skema versi `uangku-MAYOR.MINOR.PATCH` pada nama cache:
- **MINOR** (`5.1.0` → `5.2.0`) naik setiap ada fitur baru
- **PATCH** (`5.1.0` → `5.1.1`) naik setiap ada perbaikan bug

Naikkan versi ini setiap kali `index.html`, `style.css`, atau `script.js` berubah, agar pengguna lama menerima berkas terbaru dari service worker.

## 📝 Catatan

- Aplikasi mendukung semua browser modern (Chrome, Firefox, Edge, Safari)
- Data hanya tersimpan lokal di device Anda - tidak ada koneksi server
- Untuk keamanan maksimal, gunakan fitur export untuk membuat backup reguler

## 📧 Support & Feedback

Jika Anda memiliki saran atau menemukan bug, silakan buat issue di repositori ini!

---

<div align="center">

**Dibuat dengan ❤️ untuk membantu Anda mengelola keuangan dengan lebih baik**

⭐ Jika Anda suka proyek ini, berikan bintang!

</div>
