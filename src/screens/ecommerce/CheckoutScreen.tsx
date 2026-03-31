import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import OrderSummaryCard from "../../components/ecommerce/OrderSummaryCard";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "../../components/ecommerce/PaymentMethodSelector";
import AppScreenBackground from "../../components/ui/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { fetchCurrentUser } from "../../services/api/authApi";
import {
  cancelOrder,
  confirmPayment,
  getOrderById,
  type OrderDetailItemApi,
} from "../../services/api/orderApi";
import { useAuthStore } from "../../store/useAuthStore";

type CheckoutScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Checkout"
>;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

const formatVnd = (amount: number): string => {
  return `${Number(amount ?? 0).toLocaleString("vi-VN")}đ`;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const notify = (message: string): void => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert("Thông báo", message);
};

export default function CheckoutScreen({
  route,
  navigation,
}: CheckoutScreenProps): ReactElement {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("momo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(false);

  const orderId = Number(route.params?.orderId ?? 0);

  const orderQuery = useQuery({
    queryKey: ["order", "detail", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Number.isFinite(orderId) && orderId > 0,
  });

  const orderItems = useMemo<OrderDetailItemApi[]>(() => {
    return Array.isArray(orderQuery.data?.details)
      ? orderQuery.data.details
      : [];
  }, [orderQuery.data?.details]);

  const totalAmount = useMemo<number>(() => {
    const fromApi = Number(
      orderQuery.data?.totalAmount ?? orderQuery.data?.total_amount ?? 0,
    );

    if (Number.isFinite(fromApi) && fromApi > 0) {
      return fromApi;
    }

    return orderItems.reduce((sum, item) => {
      const price = Number(
        item.finalPrice ??
          item.final_price ??
          item.unitPrice ??
          item.unit_price ??
          0,
      );
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [orderItems, orderQuery.data?.totalAmount, orderQuery.data?.total_amount]);

  const orderCode = `EDUF-${String(orderId || 0).padStart(6, "0")}`;
  const rewardPoints = Number(user?.rewardPoints ?? 0);
  const maxDiscount = rewardPoints * 1000;
  const discountAmount = useRewardPoints
    ? Math.min(maxDiscount, totalAmount)
    : 0;
  const finalPrice = Math.max(0, totalAmount - discountAmount);

  const handleConfirmPayment = async (): Promise<void> => {
    if (!Number.isFinite(orderId) || orderId <= 0 || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      await confirmPayment(orderId, { useRewardPoints });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["cart", "badge"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "my-orders"] }),
        queryClient.invalidateQueries({
          queryKey: ["order", "detail", orderId],
        }),
        queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
      ]);

      try {
        const freshUser = await fetchCurrentUser();
        useAuthStore.getState().setUser(freshUser);
      } catch {
        // Keep checkout flow successful even when profile refresh fails.
      }

      notify("Thanh toán thành công!");
      navigation.replace("MainTabs", { screen: "MyLearning" });
    } catch (error) {
      Alert.alert(
        "Thanh toán thất bại",
        getApiErrorMessage(error, "Không thể xác nhận thanh toán."),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = (): void => {
    if (!Number.isFinite(orderId) || orderId <= 0 || isProcessing) {
      return;
    }

    Alert.alert(
      "Hủy đơn hàng",
      "Bạn chắc chắn muốn hủy đơn hàng này? Bạn có thể thanh toán lại sau.",
      [
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
                setIsProcessing(true);
                await cancelOrder(orderId);

                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ["orders"] }),
                  queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
                  queryClient.invalidateQueries({ queryKey: ["cart"] }),
                  queryClient.invalidateQueries({
                    queryKey: ["cart", "badge"],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: ["orders", "my-orders"],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: ["order", "detail", orderId],
                  }),
                ]);

                notify("Đã hủy đơn hàng.");
                navigation.goBack();
              } catch (error) {
                Alert.alert(
                  "Không thể hủy đơn",
                  getApiErrorMessage(error, "Vui lòng thử lại sau."),
                );
              } finally {
                setIsProcessing(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-8">
        <AppScreenBackground />
        <Text className="text-center text-base font-bold text-slate-800">
          Mã đơn hàng không hợp lệ.
        </Text>
        <Pressable
          className="mt-5 rounded-full bg-violet-600 px-6 py-3"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-sm font-bold text-white">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-8">
        <AppScreenBackground />
        <Text className="text-center text-base font-bold text-slate-800">
          Không thể tải chi tiết đơn hàng.
        </Text>
        <Pressable
          className="mt-5 rounded-full bg-violet-600 px-6 py-3"
          onPress={() => {
            void orderQuery.refetch();
          }}
        >
          <Text className="text-sm font-bold text-white">Thử lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={["bottom"]}>
      <AppScreenBackground />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-52"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 overflow-hidden rounded-[24px] border border-white/70 bg-white/75 p-4">
          <Text className="text-sm font-bold text-slate-800">
            Thông tin nhận khóa học
          </Text>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            Mã đơn: {orderCode}
          </Text>
          <Text className="mt-2 text-sm font-semibold text-slate-700">
            Trạng thái:{" "}
            {String(orderQuery.data.status ?? "pending").toUpperCase()}
          </Text>
        </View>

        <View className="mb-4 overflow-hidden rounded-[24px] border border-white/70 bg-white/75 p-4">
          <Text className="mb-3 text-sm font-bold text-slate-800">
            Đơn hàng của bạn ({orderItems.length})
          </Text>

          <View className="gap-3">
            {orderItems.map((item) => {
              const title = item.course?.title ?? "Khóa học";
              const image =
                item.course?.thumbnailUrl ??
                item.course?.thumbnail_url ??
                FALLBACK_IMAGE;
              const instructor =
                item.course?.instructor?.fullName ??
                item.course?.instructor?.profile?.fullName ??
                "Giảng viên";
              const itemPrice = Number(
                item.finalPrice ??
                  item.final_price ??
                  item.unitPrice ??
                  item.unit_price ??
                  0,
              );

              return (
                <View
                  key={String(item.id ?? `${title}-${itemPrice}`)}
                  className="flex-row gap-3"
                >
                  <Image
                    source={{ uri: image }}
                    className="h-16 w-16 rounded-xl"
                  />
                  <View className="flex-1 justify-center">
                    <Text
                      className="text-sm font-bold text-slate-800"
                      numberOfLines={1}
                    >
                      {title}
                    </Text>
                    <Text
                      className="mt-0.5 text-[11px] font-medium text-slate-500"
                      numberOfLines={1}
                    >
                      Giảng viên: {instructor}
                    </Text>
                    <Text className="mt-1 text-sm font-black text-violet-600">
                      {formatVnd(itemPrice)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onSelect={setSelectedMethod}
        />

        <View className="mt-4">
          <OrderSummaryCard
            orderCode={orderCode}
            courseCount={orderItems.length}
            orderTotalPrice={totalAmount}
            rewardPoints={rewardPoints}
            useRewardPoints={useRewardPoints}
            discountAmount={discountAmount}
            finalPrice={finalPrice}
            onToggleUseRewardPoints={setUseRewardPoints}
          />
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-white/70 bg-white/90 px-4 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 16) }}
      >
        <View className="mb-3 flex-row items-center justify-between px-1">
          <Text className="text-sm font-bold text-slate-800">
            Tổng thanh toán:
          </Text>
          <View className="items-end">
            {useRewardPoints ? (
              <Text className="text-xs font-semibold text-slate-400 line-through">
                {formatVnd(totalAmount)}
              </Text>
            ) : null}
            <Text className="text-2xl font-black text-violet-600">
              {formatVnd(finalPrice)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            void handleConfirmPayment();
          }}
          disabled={isProcessing}
          className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${isProcessing ? "bg-violet-400" : "bg-violet-600"}`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-base font-bold text-white">
              Xác nhận thanh toán
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleCancelOrder}
          disabled={isProcessing}
          className={`mt-2 h-11 items-center justify-center rounded-xl border ${isProcessing ? "border-slate-300 bg-slate-100" : "border-red-300 bg-red-50"}`}
        >
          <Text
            className={`text-sm font-bold ${isProcessing ? "text-slate-400" : "text-red-600"}`}
          >
            Hủy đơn hàng
          </Text>
        </Pressable>

        <Text className="mt-3 text-center text-[10px] font-medium text-slate-400">
          Bạn đang thanh toán bằng {selectedMethod.toUpperCase()}
        </Text>
      </View>
    </SafeAreaView>
  );
}
