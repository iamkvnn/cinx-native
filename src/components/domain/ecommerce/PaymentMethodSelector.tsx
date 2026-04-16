import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type PaymentMethod = "momo" | "vnpay";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const METHODS: Array<{
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeBg: string;
}> = [
  {
    id: "momo",
    label: "Ví MoMo",
    subtitle: "Thanh toán nhanh qua app",
    icon: "wallet-outline",
    badgeBg: "#a21caf",
  },
  {
    id: "vnpay",
    label: "VNPay",
    subtitle: "Thanh toán qua cổng VNPay",
    icon: "qr-code-outline",
    badgeBg: "#2563eb",
  },
];

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps): ReactElement {
  return (
    <View
      className="overflow-hidden rounded-[24px] border border-white/70 bg-white/75 p-4"
      style={styles.cardShadow}
    >
      <BlurView
        intensity={28}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />

      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="card-outline" size={18} color="#475569" />
        <Text className="text-sm font-bold text-slate-800">
          Phương thức thanh toán
        </Text>
      </View>

      <View className="gap-3">
        {METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <Pressable
              key={method.id}
              onPress={() => onSelect(method.id)}
              className={`flex-row items-center justify-between rounded-2xl border px-3 py-3 ${isSelected ? "border-violet-500 bg-violet-50" : "border-white/70 bg-white/60"}`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: method.badgeBg }}
                >
                  <Ionicons name={method.icon} size={18} color="#ffffff" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800">
                    {method.label}
                  </Text>
                  <Text className="text-[11px] font-medium text-slate-500">
                    {method.subtitle}
                  </Text>
                </View>
              </View>

              <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? "border-violet-500" : "border-slate-300"}`}
              >
                <View
                  className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-violet-500" : "bg-transparent"}`}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#1f2937",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
