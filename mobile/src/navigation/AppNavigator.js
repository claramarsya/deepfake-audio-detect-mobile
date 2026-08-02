import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import DetectionScreen from "../screens/DetectionScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Beranda" component={HomeScreen} />
        <Stack.Screen name="Deteksi" component={DetectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
