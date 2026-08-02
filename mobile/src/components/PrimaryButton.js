import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export default function PrimaryButton({ title, onPress, loading, disabled, variant = "solid" }) {
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        !isOutline && !isGhost && styles.solid,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.primary : "#fff"} />
      ) : (
        <Text
          style={[
            styles.text,
            (isOutline || isGhost) && { color: colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  outline: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: colors.tertiary + "55",
  },
  disabled: { opacity: 0.5 },
  text: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
});
