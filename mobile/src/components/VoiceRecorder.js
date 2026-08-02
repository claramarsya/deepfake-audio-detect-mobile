import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export default function VoiceRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 550, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Izin mikrofon diperlukan untuk merekam suara.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      alert("Gagal memulai rekaman: " + err.message);
    }
  };

  const stopRecording = async () => {
    try {
      clearInterval(timerRef.current);
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const durationSec = seconds;
      setRecording(null);
      onRecorded({ uri, durationSec });
    } catch (err) {
      alert("Gagal menghentikan rekaman: " + err.message);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, isRecording && styles.ringActive, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.85}
        >
          <Ionicons name={isRecording ? "square" : "mic"} size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.timer}>{formatTime(seconds)}</Text>
      <Text style={styles.hint}>
        {isRecording
          ? "Sedang merekam... ketuk untuk berhenti"
          : "Ketuk untuk mulai merekam"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 16 },
  ring: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary + "22",
  },
  ringActive: { backgroundColor: colors.fake + "22" },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recordBtnActive: { backgroundColor: colors.fake },
  timer: { marginTop: 12, fontSize: 19, fontFamily: fonts.bold, color: colors.ink },
  hint: { marginTop: 4, fontSize: 12.5, color: colors.textMuted, textAlign: "center" },
});
