import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import PrimaryButton from "../components/PrimaryButton";
import VoiceRecorder from "../components/VoiceRecorder";
import AudioPreviewPlayer from "../components/AudioPreviewPlayer";
import ResultCard from "../components/ResultCard";
import { PREDICT_ENDPOINT } from "../config";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function DetectionScreen({ navigation }) {
  const [mode, setMode] = useState("idle"); // "idle" | "record"
  const [audioFile, setAudioFile] = useState(null); // { uri, name, mimeType }
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const resetResult = () => setResult(null);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];

      // Validasi ukuran file (maks 10 MB)
      let size = asset.size;
      if (size == null) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          size = info.size;
        } catch (e) {
          size = null;
        }
      }
      if (size && size > MAX_FILE_SIZE_BYTES) {
        Alert.alert(
          "File terlalu besar",
          `Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB. File yang kamu pilih berukuran ${(size / (1024 * 1024)).toFixed(1)} MB.`
        );
        return;
      }

      setAudioFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setMode("idle");
      resetResult();
    } catch (err) {
      Alert.alert("Error", "Gagal memilih file: " + err.message);
    }
  };

  const handleRecorded = ({ uri, durationSec }) => {
    if (durationSec < 1) {
      Alert.alert("Terlalu singkat", "Rekaman terlalu pendek, coba rekam lagi.");
      return;
    }
    setAudioFile({ uri, name: `rekaman_${Date.now()}.m4a`, mimeType: "audio/m4a" });
    setMode("idle");
    resetResult();
  };

  const clearAudio = () => {
    setAudioFile(null);
    setMode("idle");
    resetResult();
  };

  const runDetection = async () => {
    if (!audioFile) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: audioFile.uri,
        name: audioFile.name,
        type: audioFile.mimeType || "audio/m4a",
      });

      const response = await fetch(PREDICT_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      Alert.alert(
        "Gagal menganalisis",
        `${err.message}\n\nPastikan backend menyala dan HP terhubung ke WiFi yang sama dengan laptop.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backBtnText}>Beranda</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.brand}>VoiceDetect</Text>
          <Text style={styles.subtitle}>
            Rekam suara langsung atau unggah file audio untuk mengetahui apakah suara
            tersebut merupakan suara asli manusia atau suara hasil rekayasa AI (deepfake).
          </Text>
        </LinearGradient>

      <View style={styles.card}>
        {!audioFile && mode === "idle" && (
          <>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.uploadTitle}>Upload File Audio</Text>
            <View style={styles.formatTag}>
              <Text style={styles.formatTagText}>MP3 · WAV · M4A · AAC · OGG · Max 10 MB</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setMode("record")}
                activeOpacity={0.85}
              >
                <Ionicons name="mic-outline" size={17} color={colors.primary} />
                <Text style={styles.actionBtnText}>Rekam Suara</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSolid]}
                onPress={pickFile}
                activeOpacity={0.85}
              >
                <Ionicons name="document-outline" size={17} color="#fff" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>Unggah</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!audioFile && mode === "record" && (
          <>
            <VoiceRecorder onRecorded={handleRecorded} />
            <TouchableOpacity onPress={() => setMode("idle")} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Batal</Text>
            </TouchableOpacity>
          </>
        )}

        {audioFile && (
          <View>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>File Siap Dianalisis</Text>
              <TouchableOpacity onPress={clearAudio} style={styles.removeBtn}>
                <Ionicons name="close" size={16} color={colors.fake} />
              </TouchableOpacity>
            </View>
            <AudioPreviewPlayer uri={audioFile.uri} fileName={audioFile.name} />
          </View>
        )}
      </View>

      {audioFile && (
        <View style={{ marginTop: 16 }}>
          <PrimaryButton title="Deteksi Sekarang" onPress={runDetection} loading={loading} />
        </View>
      )}

      {result && <ResultCard label={result.label} confidence={result.confidence} />}

        {!audioFile && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.infoText} />
            <Text style={styles.infoText}>
              {mode === "record"
                ? "Rekam suara untuk memulai deteksi."
                : "Pilih atau rekam file audio untuk memulai deteksi."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 2,
  },

  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  brand: { color: "#fff", fontSize: 26, fontFamily: fonts.extraBold, letterSpacing: 0.2 },
  subtitle: { color: "#FFEFF2", fontSize: 13, marginTop: 10, lineHeight: 19, textAlign: "justify" },

  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tertiary + "50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadTitle: { fontSize: 16, fontFamily: fonts.extraBold, color: colors.ink },
  formatTag: {
    backgroundColor: colors.cream,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    marginBottom: 18,
  },
  formatTagText: { fontSize: 11.5, color: colors.inkSoft, fontFamily: fonts.semiBold },

  actionRow: { flexDirection: "row", gap: 10, width: "100%" },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#fff",
  },
  actionBtnSolid: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.primary,
    marginLeft: 4,
  },

  cancelLink: { marginTop: 4, paddingVertical: 6 },
  cancelLinkText: { color: colors.textMuted, fontSize: 13, lineHeight: 13, fontFamily: fonts.semiBold },

  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  previewTitle: { fontFamily: fonts.extraBold, fontSize: 13.5, color: colors.ink },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.fake + "1A",
    alignItems: "center",
    justifyContent: "center",
  },

  infoBanner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.infoBg,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    alignItems: "flex-start",
  },
  infoText: { color: colors.infoText, fontSize: 12.5, flex: 1, marginLeft: 6, lineHeight: 18, textAlign: "justify" },
});
