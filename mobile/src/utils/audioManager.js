// Memastikan hanya ada SATU audio yang boleh berbunyi dalam satu waktu
// di seluruh aplikasi (contoh suara, preview file upload, rekaman, dll).
let currentSound = null;
let currentOnPause = null;

/**
 * Panggil ini SEBELUM memutar sebuah sound.
 * Otomatis men-jeda sound lain yang sedang aktif (jika ada), dan memanggil
 * callback `onPause` milik sound lama itu supaya UI-nya (ikon play/pause)
 * ikut ter-update.
 */
export async function registerActiveSound(sound, onPause) {
  if (currentSound && currentSound !== sound) {
    try {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await currentSound.pauseAsync();
      }
    } catch (e) {
      // sound lama mungkin sudah di-unload, aman untuk diabaikan
    }
    if (currentOnPause) currentOnPause();
  }
  currentSound = sound;
  currentOnPause = onPause || null;
}

/** Jeda paksa audio yang sedang aktif (dipakai saat pindah halaman/blur). */
export async function pauseActiveSound() {
  if (currentSound) {
    try {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await currentSound.pauseAsync();
      }
    } catch (e) {}
    if (currentOnPause) currentOnPause();
  }
}

/** Bersihkan referensi kalau sound tertentu di-unload. */
export function clearActiveSound(sound) {
  if (currentSound === sound) {
    currentSound = null;
    currentOnPause = null;
  }
}
