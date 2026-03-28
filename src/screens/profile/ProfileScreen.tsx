import type { ReactElement } from "react";
import { View, Text } from "react-native";

export default function ProfileScreen(): ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-slate-900">ProfileScreen</Text>
      <Text className="text-sm text-slate-500 mt-2">Hồ Sơ / Profile</Text>
    </View>
  );
}
