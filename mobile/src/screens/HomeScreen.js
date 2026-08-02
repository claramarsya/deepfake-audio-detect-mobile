import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import PrimaryButton from "../components/PrimaryButton";
import { registerActiveSound, pauseActiveSound } from "../utils/audioManager";

const REAL_TRAITS = [
  "Intonasi dan nada lebih alami",
  "Jeda dan tarikan napas tidak selalu teratur",
  "Ekspresi suara sesuai dengan emosi",
  "Bisa ada salah ucap atau suara lingkungan",
];

const AI_TRAITS = [
  "Intonasi terkadang terlalu datar atau kaku",
  "Jeda dan pengucapan bisa terasa kurang alami",
  "Nada suara kurang sesuai dengan kata yang diucapkan",
  "Perubahan kualitas suara bisa terdengar aneh",
];

function TraitCard({ title, traits, color, icon, sampleLabel, sampleFile }) {
  const [playing, setPlaying] = useState(false);
  // Sound disimpan di ref (BUKAN state) supaya tidak memicu re-run
  // useFocusEffect setiap kali objek sound berubah.
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  // Kalau screen ini kehilangan fokus (misal pindah ke halaman Deteksi),
  // paksa jeda audio contoh suara yang sedang main.
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (soundRef.current) soundRef.current.pauseAsync().catch(() => {});
        setPlaying(false);
      };
    }, [])
  );

  const toggle = async () => {
    const sound = soundRef.current;

    if (sound) {
      const status = await sound.getStatusAsync();

      // Sudah selesai diputar sebelumnya -> reset ke awal dulu sebelum play lagi
      if (status.didJustFinish || status.positionMillis >= status.durationMillis - 50) {
        await sound.setPositionAsync(0);
        await registerActiveSound(sound, () => setPlaying(false));
        await sound.playAsync();
        setPlaying(true);
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
        setPlaying(false);
      } else {
        await registerActiveSound(sound, () => setPlaying(false));
        await sound.playAsync();
        setPlaying(true);
      }
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(sampleFile, { shouldPlay: false });
    soundRef.current = newSound;
    await registerActiveSound(newSound, () => setPlaying(false));
    await newSound.playAsync();
    setPlaying(true);
    newSound.setOnPlaybackStatusUpdate((st) => {
      if (st.didJustFinish) setPlaying(false);
    });
  };

  return (
    <View style={styles.traitCard}>
      <View style={[styles.traitIconWrap, { backgroundColor: color + "1A" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.traitCardTitle, { color }]}>{title}</Text>

      <View style={{ marginTop: 10, marginBottom: 6 }}>
        {traits.map((t, i) => (
          <View key={i} style={styles.traitRow}>
            <View style={[styles.traitDot, { backgroundColor: color }]} />
            <Text style={styles.traitText}>{t}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.sampleBtn, { backgroundColor: color }]}
        onPress={toggle}
        activeOpacity={0.85}
      >
        <Text style={styles.sampleBtnText} numberOfLines={1}>{sampleLabel}</Text>
        <Ionicons name={playing ? "pause-circle" : "play-circle"} size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  // Jaga-jaga: kalau user pindah tab lewat cara lain (bukan lewat tombol
  // "Mulai Deteksi"), tetap jeda audio yang sedang aktif.
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        pauseActiveSound();
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.brand}>VoiceDetect</Text>
          <Text style={styles.heroText}>
            VoiceDetect adalah aplikasi yang membantu memeriksa apakah sebuah audio
            merupakan suara asli manusia atau suara hasil rekayasa AI (deepfake).
          </Text>
        </LinearGradient>

        <PrimaryButton
          title="Mulai Deteksi"
          onPress={async () => {
            await pauseActiveSound();
            navigation.navigate("Deteksi");
          }}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Ionicons
              name="chevron-forward-outline"
              size={16}
              color={colors.primary}
              style={{ marginLeft: 1 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Kenali Ciri Suaranya</Text>
            <Text style={styles.sectionSubtitle}>
              Bandingkan ciri suara manusia dan hasil rekayasa AI di bawah ini
            </Text>
          </View>
        </View>

        <View style={styles.traitRowWrap}>
          <TraitCard
            title="Ciri Suara Manusia Asli"
            traits={REAL_TRAITS}
            color={colors.real}
            icon="person-circle"
            sampleLabel="Contoh Suara Manusia Asli"
            sampleFile={require("../../assets/audio/real_sample.wav")}
          />
          <TraitCard
            title="Ciri Suara Rekayasa AI"
            traits={AI_TRAITS}
            color={colors.fake}
            icon="hardware-chip"
            sampleLabel="Contoh Suara AI"
            sampleFile={require("../../assets/audio/fake_sample.wav")}
          />
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={16} color={colors.infoText} />
          <Text style={styles.infoText}>
            Ciri-ciri di atas hanya gambaran umum. Teknologi AI terus berkembang, sehingga
            suara buatan AI bisa terdengar sangat mirip dengan suara manusia. Sebaliknya, suara
            manusia juga bisa terdengar tidak alami karena kualitas rekaman, mikrofon, gangguan
            suara, atau proses editing. Gunakan VoiceDetect sebagai alat bantu dan informasi
            awal, bukan sebagai keputusan akhir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },

  hero: {
    borderRadius: 24,
    padding: 24,
    marginTop: 12,
    marginBottom: 20,
  },
  brand: { color: "#fff", fontSize: 28, fontFamily: fonts.extraBold, letterSpacing: 0.2 },
  heroText: { color: "#FFEFF2", fontSize: 13.5, marginTop: 12, lineHeight: 20, textAlign: "justify" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tertiary,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15.5,
    color: colors.primary,
  },
  sectionSubtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  traitRowWrap: { flexDirection: "row", gap: 12 },
  traitCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  traitIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  traitCardTitle: { fontFamily: fonts.extraBold, fontSize: 13, lineHeight: 17 },

  traitRow: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginBottom: 6 },
  traitDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  traitText: { flex: 1, fontSize: 11, color: colors.inkSoft, lineHeight: 15.5, textAlign: "justify" },

  sampleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  sampleBtnText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    flexShrink: 1,
    marginRight: 6,
  },

  infoBanner: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.infoBg,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    alignItems: "flex-start",
  },
  infoText: { color: colors.infoText, fontSize: 12.3, flex: 1, marginLeft: 6, lineHeight: 18, textAlign: "justify" },
});
