import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { registerActiveSound, clearActiveSound } from "../utils/audioManager";

const formatMs = (ms) => {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function AudioPreviewPlayer({ uri, fileName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef(null);

  // Muat file (tanpa memutar) begitu uri berubah, supaya durasi langsung
  // kelihatan tanpa harus menekan play dulu.
  useEffect(() => {
    let cancelled = false;

    const unloadCurrent = async () => {
      if (soundRef.current) {
        clearActiveSound(soundRef.current);
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };

    (async () => {
      await unloadCurrent();
      setIsPlaying(false);
      setMuted(false);
      setPosition(0);
      setDuration(0);

      if (!uri) return;

      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );
        if (cancelled) {
          sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        setDuration(status.durationMillis || 0);
        sound.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) return;
          setPosition(st.positionMillis || 0);
          setDuration(st.durationMillis || 0);
          if (st.didJustFinish) setIsPlaying(false);
        });
      } catch (e) {
        // gagal memuat metadata, biarkan durasi 0:00 dan tetap bisa dicoba play
      }
    })();

    return () => {
      cancelled = true;
      unloadCurrent();
    };
  }, [uri]);

  const togglePlay = async () => {
    const sound = soundRef.current;
    if (!sound) return;

    const status = await sound.getStatusAsync();

    if (status.isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (status.didJustFinish || status.positionMillis >= status.durationMillis - 50) {
      await sound.setPositionAsync(0);
    }

    await registerActiveSound(sound, () => setIsPlaying(false)); // jeda audio lain yang sedang main
    await sound.playAsync();
    setIsPlaying(true);
  };

  const toggleMute = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const next = !muted;
    await sound.setIsMutedAsync(next);
    setMuted(next);
  };

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.fileTag}>
        <Ionicons name="musical-notes" size={14} color={colors.primary} />
        <Text style={styles.fileTagText} numberOfLines={1}>{fileName}</Text>
      </View>

      <View style={styles.playerRow}>
        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={16} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.timeText}>
          {formatMs(position)}/{formatMs(duration)}
        </Text>

        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
        </View>

        <TouchableOpacity onPress={toggleMute} hitSlop={8}>
          <Ionicons
            name={muted ? "volume-mute-outline" : "volume-medium-outline"}
            size={17}
            color={muted ? colors.fake : colors.inkSoft}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  fileTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  fileTagText: { fontSize: 12, fontFamily: fonts.bold, color: colors.ink, marginLeft: 4 },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: { fontSize: 12, color: colors.inkSoft, fontVariant: ["tabular-nums"], width: 72 },
  track: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.tertiary + "60",
    overflow: "hidden",
  },
  trackFill: { height: "100%", backgroundColor: colors.secondary, borderRadius: 999 },
});
