import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type {
  OrderApi,
  OrderDetailItemApi,
} from "../../../services/api/orderApi";

interface OrderHistoryCardProps {
  order: OrderApi;
  onReview: (order: OrderApi) => void;
  onLearn: (order: OrderApi) => void;
  onPay: (order: OrderApi) => void;
  onCancel: (order: OrderApi) => void;
  onRepurchase: (order: OrderApi) => void;
  isCancelling: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

const normalizeStatus = (
  status: string | undefined,
): "COMPLETED" | "PENDING" | "CANCELLED" => {
  const normalized = String(status ?? "").toUpperCase();

  if (normalized === "PENDING") {
    return "PENDING";
  }

  if (normalized === "CANCELLED") {
    return "CANCELLED";
  }

  return "COMPLETED";
};

const getOrderItems = (order: OrderApi): OrderDetailItemApi[] => {
  if (Array.isArray(order.details)) {
    return order.details;
  }

  if (Array.isArray(order.orderItems)) {
    return order.orderItems;
  }

  return [];
};

const formatVnd = (amount: number): string => {
  return `${Number(amount ?? 0).toLocaleString("vi-VN")}đ`;
};

export default function OrderHistoryCard({
  order,
  onReview,
  onLearn,
  onPay,
  onCancel,
  onRepurchase,
  isCancelling,
}: OrderHistoryCardProps): ReactElement {
  const status = normalizeStatus(order.status);
  const items = getOrderItems(order);
  const firstItem = items[0];
  const firstCourse = firstItem?.course;
  const firstTitle = firstCourse?.title ?? "Khóa học";
  const courseCount = items.length;
  const title =
    courseCount > 1
      ? `${firstTitle} + ${courseCount - 1} khóa khác`
      : firstTitle;
  const thumbnail = firstCourse?.images?.[0]?.imageUrl ?? FALLBACK_IMAGE;
  const total = Number(
    order.totalAmount ?? order.total_amount ?? order.totalPrice ?? 0,
  );

  const badgeClass =
    status === "COMPLETED"
      ? "bg-green-100 text-green-700"
      : status === "PENDING"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  const badgeText =
    status === "COMPLETED"
      ? "Đã thanh toán"
      : status === "PENDING"
        ? "Đang chờ"
        : "Đã hủy";

  return (
    <View
      className="mb-4 overflow-hidden rounded-[24px] border border-white/80 bg-white/70"
      style={styles.cardShadow}
    >
      <BlurView
        intensity={22}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />

      <View className="flex-col items-start gap-2 border-b border-slate-100 px-4 py-3">
        <View className="flex-row items-center w-full justify-between">
           <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
             Mã đơn hàng:
           </Text>
           <Text
            className={`rounded-full px-3 py-1 text-[10px] font-bold ${badgeClass}`}
           >
            {badgeText}
           </Text>
        </View>
        <Text className="text-xs font-black uppercase tracking-wider text-slate-700 w-full" numberOfLines={2}>
          #{order.id ?? "-"}
        </Text>
      </View>

      <View className="flex-row gap-3 px-4 py-3">
        <Image source={{ uri: thumbnail }} className="h-16 w-16 rounded-xl" />
        <View className="flex-1">
          <Text className="text-sm font-bold text-slate-800" numberOfLines={2}>
            {title}
          </Text>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            {courseCount} khóa học
          </Text>
          <Text className="mt-2 text-base font-black text-violet-600">
            {formatVnd(total)}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-end gap-2 border-t border-slate-100 px-4 py-3">
        {status === "COMPLETED" ? (
          <>
            <Pressable
              onPress={() => onReview(order)}
              className="rounded-xl border border-slate-200 px-4 py-2"
            >
              <Text className="text-xs font-bold text-slate-700">Đánh giá</Text>
            </Pressable>
            <Pressable
              onPress={() => onLearn(order)}
              className="rounded-xl bg-violet-600 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">Học ngay</Text>
            </Pressable>
          </>
        ) : null}

        {status === "PENDING" ? (
          <>
            <Pressable
              onPress={() => onCancel(order)}
              disabled={isCancelling}
              className={`rounded-xl border px-4 py-2 ${isCancelling ? "border-slate-200 bg-slate-100" : "border-slate-200 bg-white"}`}
            >
              <Text
                className={`text-xs font-bold ${isCancelling ? "text-slate-400" : "text-slate-700"}`}
              >
                Hủy đơn
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onPay(order)}
              className="rounded-xl bg-slate-900 px-4 py-2"
            >
              <Text className="text-xs font-bold text-white">
                Thanh toán ngay
              </Text>
            </Pressable>
          </>
        ) : null}

        {status === "CANCELLED" ? (
          <Pressable
            onPress={() => onRepurchase(order)}
            className="rounded-xl bg-violet-100 px-4 py-2"
          >
            <Text className="text-xs font-bold text-violet-700">Mua lại</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#1f2687",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
