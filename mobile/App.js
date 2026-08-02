import React from "react";
import { Text, View, Platform, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { fonts } from "./src/theme/fonts";
import { colors } from "./src/theme/colors";
import AppNavigator from "./src/navigation/AppNavigator";

// Set Plus Jakarta Sans Regular sebagai font default untuk SEMUA <Text>
// di aplikasi, tanpa perlu menambahkan fontFamily satu-satu di setiap file.
//
// Di Android, `includeFontPadding` bawaan menambahkan ruang ekstra di atas/bawah
// teks berdasarkan metrik font. Karena Plus Jakarta Sans punya ascent/descent
// beda dari font sistem, ini bikin teks kelihatan "turun" sedikit — terutama
// kalau sejajar sama ikon. Mematikannya + textAlignVertical: "center" meratakan itu.
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [
  {
    fontFamily: fonts.regular,
    ...(Platform.OS === "android"
      ? { includeFontPadding: false, textAlignVertical: "center" }
      : {}),
  },
  Text.defaultProps.style,
];

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
