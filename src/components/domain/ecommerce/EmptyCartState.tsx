import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EmptyCartStateProps {
  onExplore: () => void;
}

export default function EmptyCartState({
  onExplore,
}: EmptyCartStateProps): ReactElement {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-16 pt-12">
      <View
        className="mb-6 h-40 w-40 items-center justify-center rounded-full border border-white/60 bg-white/70"
        style={styles.iconWrapShadow}
      >
        <BlurView
          intensity={35}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="bag-handle-outline" size={64} color="#a78bfa" />
      </View>

      <Text className="mb-2 text-center text-2xl font-black text-slate-800">
        Giỏ hàng trống
      </Text>
      <Text className="mb-8 text-center text-sm font-medium leading-6 text-slate-500">
        Bạn chưa thêm khóa học nào vào giỏ hàng. Hãy khám phá thêm ngay nhé.
      </Text>

      <Pressable
        onPress={onExplore}
        className="flex-row items-center gap-2 rounded-full bg-slate-900 px-7 py-3.5"
        style={({ pressed }) => [
          styles.exploreButtonShadow,
          pressed && styles.pressed,
        ]}
      >
        <Text className="text-sm font-bold text-white">Khám phá khóa học</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapShadow: {
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  exploreButtonShadow: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
