# 🎵 VibeCheck (Cek Vibe Musik)

VibeCheck adalah aplikasi web interaktif yang menganalisis kepribadian dan "aura" kamu berdasarkan 5 lagu favorit pilihanmu. Menggunakan perpaduan antara **Spotify API** untuk pencarian lagu secara *real-time* dan **Google Gemini API** untuk analisis psikologi musik, aplikasi ini akan membedah seleramu, mengkalkulasi metrik kepribadian, hingga merekomendasikan lagu ekstra yang sangat resonan dengan vibemu.

---

## ✨ Fitur Utama

- 🔍 **Pencarian Lagu Terintegrasi:** Cari lagu favoritmu langsung menggunakan data dari Spotify API.
- 🤖 **Analisis Karakter Berbasis AI:** Ditenagai oleh model Gemini 3.5 Flash untuk membaca kepribadian dari jajaran musik pilihanmu.
- 🎭 **Dua Mode Analisis:**
  - **Validasi (Hype):** AI akan memuji, mendukung, dan memberikan validasi positif terhadap selera musikmu (supportive mode).
  - **Roasting Brutal:** Siapkan mental! AI akan mengkritik selera musikmu secara pedas, sarkastik, namun tetap menghibur.
- 🎨 **User Interface Dinamis:** Latar belakang, animasi *glow*, dan aksen visual akan menyesuaikan dengan "Warna Aura" (Hex Color) hasil analisismu.
- 🎶 **The Missing Track:** Mendapatkan rekomendasi lagu ke-6 lengkap dengan *embedded* Spotify player yang mungkin belum kamu dengar tapi sangat mewakili auramu.
- 📸 **Shareable Result:** Hasil identitas musikmu dapat diekspor menjadi gambar (PNG) dengan rapi yang siap dipamerkan ke media sosial.

## 🛠️ Tech Stack & Dependencies

**Frontend:**
- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) untuk styling
- [Motion (Framer Motion)](https://motion.dev/) untuk animasi transisi UI yang mulus
- [Lucide React](https://lucide.dev/) untuk ikon-ikon estetik
- [html-to-image](https://github.com/bubkoo/html-to-image) & [canvas-confetti](https://www.kirilv.com/canvas-confetti/)

**Backend:**
- [Express.js](https://expressjs.com/) (berjalan bersamaan dengan Vite dev server menggunakan `tsx`, dan dikompilasi menggunakan `esbuild` untuk production)
- [Node.js](https://nodejs.org/)

**Integrasi Pihak Ketiga (API):**
- `@google/genai` (Google Gemini API) untuk pembuatan *prompt* dan analisis kepribadian
- Spotify Web API (Client Credentials Flow) untuk pencarian katalog lagu

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Persiapan (Prerequisites)
Pastikan sistem kamu sudah terpasang:
- **Node.js** (versi 18+ direkomendasikan)
- [Google Gemini API Key](https://aistudio.google.com/)
- [Spotify Developer Credentials](https://developer.spotify.com/dashboard) (Client ID & Client Secret)

### 2. Kloning & Instalasi Dependensi
Jalankan perintah berikut di terminal:
```bash
# Install seluruh dependencies yang dibutuhkan
npm install
```

### 3. Konfigurasi Environment Variables
Buat sebuah file bernama .env di root directory proyek, lalu isi dengan kredensial API-mu:
```bash
GEMINI_API_KEY=masukkan_api_key_gemini_kamu_di_sini
SPOTIFY_CLIENT_ID=masukkan_client_id_spotify_kamu_di_sini
SPOTIFY_CLIENT_SECRET=masukkan_client_secret_spotify_kamu_di_sini
```

### 4. Menjalankan Mode Development
Jalankan perintah di bawah ini untuk memulai development server:
```bash
npm run dev
```
Aplikasi bisa langsung diakses melalui browser di alamat: *http://localhost:3000*.
