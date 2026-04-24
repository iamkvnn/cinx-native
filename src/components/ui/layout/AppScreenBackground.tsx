import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactElement } from "react";
import { StyleSheet, View } from "react-native";

export default function AppScreenBackground(): ReactElement {
  return (
    <View pointerEvents="none" style={styles.backgroundContainer}>
      <LinearGradient
        colors={["#f8fafc", "#eef2ff", "#f0f9ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />
      <BlurView intensity={36} tint="light" style={styles.blurFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },
  blob1: {
    position: "absolute",
    top: "-10%",
    right: "-10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(221, 214, 254, 0.8)",
    opacity: 0.6,
  },
  blob2: {
    position: "absolute",
    top: "30%",
    left: "-20%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(221, 214, 254, 0.8)",
    opacity: 0.6,
  },
  blob3: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(221, 214, 254, 0.8)",
    opacity: 0.6,
  },
});
