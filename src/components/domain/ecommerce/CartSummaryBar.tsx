import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { OrderApi } from "../../../services/api/orderApi";

interface CartSummaryBarProps {
  totalPrice: number;
  onCheckout: () => void;
  onContinuePendingCheckout: (orderId: number) => void;
  isLoading: boolean;
  pendingOrder?: OrderApi;
  disabled?: boolean;
  bottomInset?: number;
  bottomOffset?: number;
}

const formatVnd = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export default function CartSummaryBar({
  totalPrice,
  onCheckout,
  onContinuePendingCheckout,
  isLoading,
  pendingOrder,
  disabled = false,
  bottomInset = 16,
  bottomOffset = 0,
}: CartSummaryBarProps): ReactElement {
  const pendingOrderId = Number(pendingOrder?.id ?? 0);
  const hasPendingOrder = Number.isFinite(pendingOrderId) && pendingOrderId > 0;

  const handlePressCheckout = (): void => {
    if (hasPendingOrder) {
      onContinuePendingCheckout(pendingOrderId);
      return;
    }

    onCheckout();
  };

  return (
    <View
      className="absolute inset-x-0 bottom-0 border-t border-white/70 bg-white/80 px-4 pt-4"
      style={[
        styles.containerShadow,
        {
          // Keep the bar anchored to bottom so its background fills behind nav bar.
          paddingBottom: Math.max(bottomInset, 10) + Math.max(bottomOffset, 0),
        },
      ]}
    >
      <BlurView
        intensity={35}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />

      <View className="mx-auto w-full max-w-md flex-row items-center gap-4">
        <View className="pl-1">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Tổng thanh toán
          </Text>
          <Text className="mt-0.5 text-xl font-black text-slate-900">
            {formatVnd(totalPrice)}
          </Text>
        </View>

        <Pressable
          onPress={handlePressCheckout}
          disabled={disabled || isLoading}
          className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-violet-600"
          style={({ pressed }) => [
            styles.ctaShadow,
            pressed && !(disabled || isLoading) ? styles.ctaPressed : null,
            disabled || isLoading ? styles.ctaDisabled : null,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text className="text-base font-bold text-white">
                {hasPendingOrder ? "Tiếp tục thanh toán" : "Thanh toán"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerShadow: {
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaShadow: {
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaDisabled: {
    opacity: 0.6,
  },
});
