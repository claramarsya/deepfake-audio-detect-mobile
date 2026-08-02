import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export default function ResultCard({ label, confidence }) {
  const isFake = label === "FAKE";
  const color = isFake ? colors.fake : colors.real;
  const bg = isFake ? colors.fake + "1A" : colors.real + "1A";
  const icon = isFake ? "warning" : "checkmark-circle";
  const text = isFake ? "PALSU (AI)" : "ASLI";

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.badgeText, { color }]}>{text}</Text>
      </View>

      <Text style={styles.confLabel}>Confidence Model</Text>
      <Text style={[styles.confNumber, { color }]}>
        {(confidence * 100).toFixed(2)}%
      </Text>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(confidence * 100, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={styles.resultSummary}>
        Audio terdeteksi sebagai {isFake ? "suara hasil rekayasa AI (deepfake)" : "suara manusia asli"} sebesar {(confidence * 100).toFixed(2)}%.
      </Text>

      <View style={styles.footnote}>
        <Ionicons name="information-circle-outline" size={16} color={colors.infoText} />
        <Text style={styles.footnoteText}>
          Hasil deteksi ini merupakan prediksi dari AI dan masih mungkin terjadi kesalahan.
          Jangan menjadikan hasil ini sebagai satu-satunya dasar dalam mengambil keputusan.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 22,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.extraBold,
    fontSize: 14.5,
    lineHeight: 14.5,
    marginLeft: 6,
    letterSpacing: 0.3,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  confLabel: { fontFamily: fonts.bold, color: colors.inkSoft, fontSize: 14, marginTop: 18 },
  confNumber: { fontSize: 46, fontFamily: fonts.extraBold, marginTop: 2, marginBottom: 10 },
  progressTrack: {
    width: "100%",
    height: 9,
    backgroundColor: colors.tertiary + "40",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  resultSummary: {
    marginTop: 14,
    fontSize: 13,
    color: colors.ink,
    textAlign: "center",
    lineHeight: 19,
  },
  footnote: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: colors.infoBg,
    borderRadius: 14,
    padding: 13,
    marginTop: 16,
  },
  footnoteText: { color: colors.infoText, fontSize: 12, flex: 1, lineHeight: 17, marginLeft: 6, textAlign: "justify" },
});
