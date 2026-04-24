import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { ReactElement, ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

export function MenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <View className="mb-6">
      <Text className="mb-2 ml-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </Text>
      <View className="overflow-hidden" style={styles.glassPanel}>
        <BlurView
          intensity={28}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        {children}
      </View>
    </View>
  );
}

export function MenuItem({
  icon,
  title,
  color,
  badge,
  showLeadingIcon = true,
  onPress,
}: {
  icon: string;
  title: string;
  color: string;
  badge?: number;
  showLeadingIcon?: boolean;
  onPress?: () => void;
}): ReactElement {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-100",
    blue: "bg-blue-100",
    pink: "bg-pink-100",
    emerald: "bg-emerald-100",
    violet: "bg-violet-100",
    indigo: "bg-indigo-100",
    red: "bg-red-50",
    slate: "bg-slate-100",
  };

  const iconColorMap: Record<string, string> = {
    orange: "#f97316",
    blue: "#2563eb",
    pink: "#ec4899",
    emerald: "#059669",
    violet: "#9333ea",
    indigo: "#4f46e5",
    red: "#ef4444",
    slate: "#64748b",
  };

  return (
    <Pressable
      onPress={onPress}
      className="border-b border-slate-100/80 flex-row items-center justify-between px-4 py-4 last:border-b-0"
    >
      <View className="flex-row items-center gap-3">
        {showLeadingIcon ? (
          <View
            className={`h-8 w-8 items-center justify-center rounded-xl ${colorMap[color] ?? colorMap.slate}`}
          >
            <Ionicons
              name={icon as never}
              size={16}
              color={iconColorMap[color] ?? iconColorMap.slate}
            />
          </View>
        ) : null}
        <Text className="text-sm font-bold text-slate-700">{title}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {badge !== undefined ? (
          <View className="h-5 w-5 items-center justify-center rounded-full bg-red-500">
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>
    </Pressable>
  );
}

export function SettingToggleItem({
  icon,
  title,
  value,
  showLeadingIcon = true,
  onValueChange,
}: {
  icon: string;
  title: string;
  value: boolean;
  showLeadingIcon?: boolean;
  onValueChange: (value: boolean) => void;
}): ReactElement {
  return (
    <View className="border-b border-slate-100/80 flex-row items-center justify-between px-4 py-4 last:border-b-0">
      <View className="flex-row items-center gap-3">
        {showLeadingIcon ? (
          <View
            className={
              icon === "moon"
                ? "h-8 w-8 items-center justify-center rounded-xl bg-slate-900"
                : "h-8 w-8 items-center justify-center rounded-xl bg-slate-100"
            }
          >
            <Ionicons
              name={icon as never}
              size={16}
              color={icon === "moon" ? "#ffffff" : "#64748b"}
            />
          </View>
        ) : null}
        <Text className="text-sm font-bold text-slate-700">{title}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="#ffffff"
        trackColor={{ false: "#cbd5e1", true: "#a78bfa" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glassPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 0,
    overflow: "hidden",
  },
});
