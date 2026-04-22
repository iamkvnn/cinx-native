import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

interface OrderSummaryCardProps {
  orderCode: string;
  courseCount: number;
  orderTotalPrice: number;
  coursePromotionDiscount: number;
  voucherCode?: string;
  voucherDiscountAmount: number;
  rewardPoints: number;
  useRewardPoints: boolean;
  rewardPointsDiscount: number;
  finalPrice: number;
  rewardPointsDisabled?: boolean;
  onToggleUseRewardPoints: (value: boolean) => void;
}

const formatVnd = (amount: number): string => {
  return `${Number(amount ?? 0).toLocaleString("vi-VN")}đ`;
};

export default function OrderSummaryCard({
  orderCode,
  courseCount,
  orderTotalPrice,
  coursePromotionDiscount,
  voucherCode,
  voucherDiscountAmount,
  rewardPoints,
  useRewardPoints,
  rewardPointsDiscount,
  finalPrice,
  rewardPointsDisabled = false,
  onToggleUseRewardPoints,
}: OrderSummaryCardProps): ReactElement {
  const canUseRewardPoints = rewardPoints > 0 && !rewardPointsDisabled;

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
        <Ionicons name="receipt-outline" size={18} color="#475569" />
        <Text className="text-sm font-bold text-slate-800">
          Tóm tắt đơn hàng
        </Text>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-slate-500">Mã đơn</Text>
          <Text className="text-sm font-black tracking-wider text-slate-800">
            {orderCode}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-slate-500">
            Số khóa học
          </Text>
          <Text className="text-sm font-bold text-slate-700">
            {courseCount}
          </Text>
        </View>

        <View className="my-1 h-px bg-slate-200/80" />

        {coursePromotionDiscount > 0 ? (
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-500">
              Giảm giá khóa học
            </Text>
            <Text className="text-sm font-bold text-emerald-600">
              -{formatVnd(coursePromotionDiscount)}
            </Text>
          </View>
        ) : null}

        {voucherCode && voucherDiscountAmount > 0 ? (
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-500">
              Voucher ({voucherCode})
            </Text>
            <Text className="text-sm font-bold text-emerald-600">
              -{formatVnd(voucherDiscountAmount)}
            </Text>
          </View>
        ) : null}

        {canUseRewardPoints ? (
          <View className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2">
            <View className="flex-row items-center justify-between">
              <Text className="pr-2 text-xs font-semibold text-slate-600">
                Dùng {rewardPoints.toLocaleString("vi-VN")} điểm thưởng (Giảm{" "}
                {formatVnd(rewardPointsDiscount)})
              </Text>
              <Switch
                value={useRewardPoints}
                onValueChange={onToggleUseRewardPoints}
                trackColor={{ false: "#cbd5e1", true: "#c4b5fd" }}
                thumbColor={useRewardPoints ? "#7c3aed" : "#f8fafc"}
              />
            </View>
          </View>
        ) : null}

        {rewardPointsDisabled ? (
          <View className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <Text className="text-xs font-semibold text-amber-700">
              Đã áp dụng voucher, tạm thời không thể dùng điểm thưởng.
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-700">
            Tổng thanh toán
          </Text>
          <View className="items-end">
            {useRewardPoints ? (
              <Text className="text-xs font-semibold text-slate-400 line-through">
                {formatVnd(orderTotalPrice)}
              </Text>
            ) : null}
            <Text className="text-xl font-black text-violet-600">
              {formatVnd(finalPrice)}
            </Text>
          </View>
        </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
