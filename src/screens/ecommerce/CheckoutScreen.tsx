import type { ReactElement } from "react";
import { View, Text } from "react-native";

export default function CheckoutScreen(): ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-slate-900">CheckoutScreen</Text>
      <Text className="text-sm text-slate-500 mt-2">Thanh Toán / Checkout</Text>
    </View>
  );
}
