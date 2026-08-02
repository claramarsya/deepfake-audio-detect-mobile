// =============================================================
// PENTING: Ganti IP di bawah ini dengan IP lokal laptop kamu.
// Cara cek IP:
//   - Windows : buka CMD, ketik "ipconfig", lihat "IPv4 Address"
//   - Mac     : buka Terminal, ketik "ipconfig getifaddr en0"
//   - Linux   : buka Terminal, ketik "hostname -I"
// HP dan laptop HARUS terhubung ke WiFi yang SAMA.
// =============================================================
export const API_BASE_URL = "https://voicedetect-backend.up.railway.app";
// export const API_BASE_URL = "http://10.84.139.185:8000";

export const PREDICT_ENDPOINT = `${API_BASE_URL}/predict`;
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
