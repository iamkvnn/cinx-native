import type { ReactElement } from "react";
import { View, Text } from "react-native";

export default function LoginScreen(): ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-slate-900">LoginScreen</Text>
      <Text className="text-sm text-slate-500 mt-2">Auth Screen</Text>
    </View>
  );
}
