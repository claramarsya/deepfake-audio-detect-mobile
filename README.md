# Deteksi Deepfake Audio — Versi Mobile

Konversi dari web Streamlit menjadi aplikasi mobile (Android/iOS via Expo React Native),
dengan tambahan fitur **rekam suara langsung** dan **halaman edukasi**.

## Arsitektur

Model AI kamu (YAMNet + DNN Keras) terlalu berat untuk dijalankan langsung di HP,
jadi dipakai pola **client-server**, yang juga umum dipakai di skripsi sejenis:

```
[Aplikasi Mobile]  --- kirim audio (upload/rekaman) --->  [Backend FastAPI]
   (Expo/React Native)         via WiFi                    (model AI kamu, di laptop)
                     <--- hasil REAL/FAKE + confidence ---
```

- **Model AI TIDAK DIUBAH SAMA SEKALI** — `main.py` di backend memuat ulang persis
  arsitektur dan logic yang ada di `app.py` Streamlit kamu (YAMNet -> scaler -> DNN).
- Ini juga memudahkan sidang: kamu bisa jelaskan alasan pemilihan arsitektur client-server
  karena keterbatasan komputasi on-device untuk deep learning model.

## Struktur folder

```
deepfake-mobile/
├── backend/              <- Jalan di laptop kamu
│   ├── main.py            (FastAPI, reuse model app.py)
│   ├── requirements.txt
│   ├── model.weights.h5   (disalin dari project asli)
│   └── scaler.pkl         (disalin dari project asli)
└── mobile/                <- Aplikasi mobile (Expo)
    ├── App.js
    ├── app.json
    ├── package.json
    ├── assets/audio/       (placeholder contoh suara, WAJIB diganti)
    └── src/
        ├── config.js       (ALAMAT IP BACKEND, WAJIB DIUBAH)
        ├── screens/
        │   ├── DetectionScreen.js   (upload / rekam + hasil deteksi)
        │   └── EducationScreen.js  (edukasi ciri suara asli vs AI)
        ├── components/
        └── navigation/
```

## LANGKAH 1 — Jalankan Backend (di laptop)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Catatan:
- Saat pertama kali start, YAMNet akan di-download dari TF-Hub (butuh internet), lalu
  ter-cache otomatis untuk run berikutnya.
- Pastikan laptop dan HP terhubung ke **WiFi yang sama**.
- Cek backend jalan dengan buka `http://localhost:8000/health` di browser laptop
  → harus muncul `{"status":"ok","model_ready":true}`.

## LANGKAH 2 — Cari IP Laptop kamu

- **Windows**: buka CMD → `ipconfig` → lihat "IPv4 Address" (contoh: `192.168.1.10`)
- **Mac**: buka Terminal → `ipconfig getifaddr en0`
- **Linux**: buka Terminal → `hostname -I`

Lalu edit file `mobile/src/config.js`, ganti baris:
```js
export const API_BASE_URL = "http://192.168.1.10:8000";
```
dengan IP laptop kamu.

## LANGKAH 3 — Jalankan Aplikasi Mobile

```bash
cd mobile
npm install
npx expo start
```

Setelah itu:
1. Install aplikasi **Expo Go** di HP (tersedia di Play Store / App Store)
2. Scan QR code yang muncul di terminal/browser pakai Expo Go
3. Aplikasi langsung terbuka di HP kamu — tanpa perlu install Android Studio / Xcode

> Tips demo sidang: nyalakan hotspot dari laptop dan sambungkan HP ke hotspot itu,
> supaya tidak tergantung WiFi kampus yang mungkin memblokir koneksi antar-device.

## LANGKAH 4 — Ganti Contoh Audio Edukasi (PENTING)

File di `mobile/assets/audio/real_sample_PLACEHOLDER.wav` dan
`ai_sample_PLACEHOLDER.wav` saat ini **hanya berisi audio senyap** (placeholder),
karena saya tidak bisa menyertakan sampel suara asli/AI sungguhan (masalah lisensi
dan sumber data).

Sebelum sidang, ganti kedua file itu dengan:
- **real_sample**: rekaman suara manusia asli (rekam sendiri saja, 5-10 detik)
- **ai_sample**: hasil text-to-speech / voice cloning (misalnya dari ElevenLabs,
  Coqui TTS, atau tool lain yang biasa kamu pakai untuk dataset skripsi)

Setelah mengganti file, update juga path `require(...)` di
`mobile/src/screens/EducationScreen.js` (baris `SAMPLES`) jika nama filenya beda.

## Build APK (opsional, untuk deploy final)

Kalau nanti butuh file `.apk` yang bisa diinstall tanpa Expo Go (misalnya untuk
dikumpulkan sebagai lampiran skripsi), pakai **EAS Build** (gratis untuk build dasar):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

Build ini jalan di server Expo (cloud), jadi tidak perlu Android Studio di laptop.
Hasilnya berupa link download `.apk`.

## Fitur yang sudah dibuat

- ✅ Upload file audio (.wav/.mp3/.m4a) — sama seperti versi web
- ✅ **Rekam suara langsung dari mikrofon HP** (fitur baru sesuai request dosen)
- ✅ Preview & putar ulang audio sebelum dideteksi
- ✅ Hasil deteksi REAL/FAKE + confidence score, tampilan mirip versi Streamlit
- ✅ **Halaman Edukasi**: ciri-ciri suara asli vs AI, dan contoh audio yang bisa diputar
  (perlu diisi sampel asli sebelum sidang — lihat Langkah 4)

## Yang perlu kamu lakukan sendiri

1. Ganti IP di `config.js` (Langkah 2)
2. Ganti sampel audio edukasi (Langkah 4)
3. Sesuaikan warna/branding kalau mau (di `mobile/src/theme/colors.js`)
4. Kalau backend akan didemokan tanpa laptop kamu terus menyala, pertimbangkan opsi
   deploy ke cloud (Render/Railway) — kabari saja kalau mau saya bantu buatkan
   konfigurasinya juga.
