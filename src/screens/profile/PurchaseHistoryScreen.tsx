import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import OrderHistoryCard from "../../components/profile/OrderHistoryCard";
import OrderStatusFilter, {
  type OrderFilterTab,
} from "../../components/profile/OrderStatusFilter";
import AppScreenBackground from "../../components/ui/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  cancelOrder,
  fetchMyOrders,
  type OrderApi,
} from "../../services/api/orderApi";

type PurchaseHistoryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "OrderHistory"
>;

const notify = (message: string): void => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert("Thông báo", message);
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    return message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const normalizeStatus = (status: string | undefined): string => {
  return String(status ?? "").toUpperCase();
};

const getFirstCourseId = (order: OrderApi): number | null => {
  const first = order.details?.[0] ?? order.orderItems?.[0];
  const id = Number(first?.course?.id ?? 0);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export default function PurchaseHistoryScreen({
  navigation,
}: PurchaseHistoryScreenProps): ReactElement {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>("ALL");

  const ordersQuery = useQuery({
    queryKey: ["orders", "my-orders"],
    queryFn: fetchMyOrders,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
  });

  const filteredOrders = useMemo<OrderApi[]>(() => {
    const orders = ordersQuery.data ?? [];

    if (activeTab === "ALL") {
      return orders;
    }

    if (activeTab === "COMPLETED") {
      return orders.filter((order) => {
        const status = normalizeStatus(order.status);
        return status === "COMPLETED" || status === "PAID";
      });
    }

    if (activeTab === "PENDING") {
      return orders.filter(
        (order) => normalizeStatus(order.status) === "PENDING",
      );
    }

    return orders.filter(
      (order) => normalizeStatus(order.status) === "CANCELLED",
    );
  }, [activeTab, ordersQuery.data]);

  const handleCancelOrder = (order: OrderApi): void => {
    const orderId = Number(order.id ?? 0);

    if (!Number.isFinite(orderId) || orderId <= 0 || cancelMutation.isPending) {
      return;
    }

    Alert.alert("Hủy đơn hàng", "Bạn chắc chắn muốn hủy đơn hàng này?", [
      {
        text: "Không",
        style: "cancel",
      },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await cancelMutation.mutateAsync(orderId);

              await Promise.all([
                queryClient.invalidateQueries({
                  queryKey: ["orders", "my-orders"],
                }),
                queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
                queryClient.invalidateQueries({ queryKey: ["cart", "badge"] }),
              ]);
            } catch (error) {
              Alert.alert(
                "Không thể hủy đơn",
                getApiErrorMessage(error, "Vui lòng thử lại sau."),
              );
            }
          })();
        },
      },
    ]);
  };

  const handleReview = (): void => {
    notify("Tính năng đánh giá sẽ sớm ra mắt.");
  };

  const handleLearnNow = (): void => {
    navigation.navigate("MainTabs", { screen: "MyLearning" });
  };

  const handlePayNow = (order: OrderApi): void => {
    const orderId = Number(order.id ?? 0);

    if (!Number.isFinite(orderId) || orderId <= 0) {
      notify("Không tìm thấy mã đơn hàng hợp lệ.");
      return;
    }

    navigation.navigate("Checkout", { orderId: String(orderId) });
  };

  const handleRepurchase = (order: OrderApi): void => {
    const courseId = getFirstCourseId(order);

    if (!courseId) {
      notify("Không tìm thấy khóa học để mua lại.");
      return;
    }

    navigation.navigate("CourseDetail", { courseId: String(courseId) });
  };

  if (ordersQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (ordersQuery.isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-8">
        <AppScreenBackground />
        <Text className="text-center text-base font-bold text-slate-800">
          Không thể tải lịch sử đơn hàng.
        </Text>
        <Pressable
          onPress={() => {
            void ordersQuery.refetch();
          }}
          className="mt-5 rounded-full bg-violet-600 px-6 py-3"
        >
          <Text className="text-sm font-bold text-white">Thử lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={["bottom"]}>
      <AppScreenBackground />

      <View
        className="overflow-hidden border-b border-white/70 bg-white/60 pb-2"
        style={[styles.glassHeader, { paddingTop: insets.top + 10 }]}
      >
        <BlurView
          intensity={26}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />

        <View className="mb-4 flex-row items-center justify-between px-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100/80"
          >
            <Ionicons name="chevron-back" size={22} color="#334155" />
          </Pressable>
          <Text className="text-base font-bold text-slate-800">
            Lịch sử đơn hàng
          </Text>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100/80">
            <Ionicons name="search" size={18} color="#64748b" />
          </Pressable>
        </View>

        <OrderStatusFilter activeTab={activeTab} onTabSelect={setActiveTab} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View
            className="items-center justify-center rounded-3xl border border-white/75 bg-white/60 px-4 py-16"
            style={styles.glassCard}
          >
            <BlurView
              intensity={24}
              tint="light"
              style={StyleSheet.absoluteFillObject}
            />
            <Text className="text-center text-sm font-semibold text-slate-500">
              Bạn chưa có đơn hàng nào ở trạng thái này
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <OrderHistoryCard
              key={String(order.id)}
              order={order}
              onReview={handleReview}
              onLearn={handleLearnNow}
              onPay={handlePayNow}
              onCancel={handleCancelOrder}
              onRepurchase={handleRepurchase}
              isCancelling={cancelMutation.isPending}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassHeader: {
    shadowColor: "#1f2937",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  glassCard: {
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
