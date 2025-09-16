import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Animated, { SlideInRight } from "react-native-reanimated";

export default function SettingsDetail() {
  const { id } = useLocalSearchParams();

  return (
    <Animated.View style={styles.container} entering={SlideInRight.duration(500)}>
      <Text style={styles.text}>Settings Detail: {id}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, fontWeight: "600", color: "#111827" },
});
