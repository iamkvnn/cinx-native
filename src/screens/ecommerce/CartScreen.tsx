import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
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

import CartItemCard, {
  type CartItemCardData,
} from "../../components/domain/ecommerce/CartItemCard";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import CartSummaryBar from "../../components/domain/ecommerce/CartSummaryBar";
import EmptyCartState from "../../components/domain/ecommerce/EmptyCartState";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import {
  fetchCart,
  removeFromCart,
  type CartApi,
  type CartItemApi,
} from "../../services/api/cartApi";
import { OrderControllerService } from "../../services/api/OrderControllerService";
import {
  checkoutOrder,
  fetchMyOrders,
  type OrderApi,
} from "../../services/api/orderApi";
import { resolvePricing } from "../../utils/pricing";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";
const FLOATING_TAB_BAR_RESERVED_SPACE = 58;

const showToast = (message: string): void => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert("Thông báo", message);
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const apiMessage =
      typeof error.response?.data === "object" && error.response?.data
        ? (error.response.data as { message?: string }).message
        : undefined;

    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const getItemPrice = (item: CartItemApi): number => {
  const pricing = resolvePricing(
    item.unitPrice ?? item.unit_price ?? item.course?.price,
    (item as { discountedPrice?: number; discounted_price?: number })
      .discountedPrice ??
      (item as { discounted_price?: number }).discounted_price ??
      item.course?.discountedPrice,
  );
  const quantity = Math.max(1, Number(item.quantity ?? 1));
  return pricing.currentPrice * quantity;
};

const getItemOriginalPrice = (item: CartItemApi): number | undefined => {
  const pricing = resolvePricing(
    item.unitPrice ?? item.unit_price ?? item.course?.price,
    (item as { discountedPrice?: number; discounted_price?: number })
      .discountedPrice ??
      (item as { discounted_price?: number }).discounted_price ??
      item.course?.discountedPrice,
  );

  if (!pricing.hasDiscount) {
    return undefined;
  }

  const quantity = Math.max(1, Number(item.quantity ?? 1));
  return pricing.originalPrice * quantity;
};

const isPendingOrderStatus = (status: unknown): boolean => {
  return (
    String(status ?? "")
      .trim()
      .toLowerCase() === "pending"
  );
};

const mapCartItem = (item: CartItemApi): CartItemCardData => {
  const course = item.course;

  return {
    cartItemId: String(item.id ?? ""),
    courseId: String(course?.id ?? ""),
    title: course?.title?.trim() || "Khóa học chưa cập nhật",
    instructorName: course?.instructor?.name ?? "Giảng viên",
    price: getItemPrice(item),
    originalPrice: getItemOriginalPrice(item),
    imageUrl: course?.images?.[0]?.imageUrl ?? FALLBACK_IMAGE,
  };
};

export default function CartScreen(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<Record<string, { close: () => void } | null>>(
    {},
  );

  const cartQuery = useQuery({
    queryKey: ["cart", "list"],
    queryFn: fetchCart,
  });

  const checkoutMutation = useMutation({
    mutationFn: checkoutOrder,
  });

  const removeItemMutation = useMutation({
    mutationFn: removeFromCart,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "my-orders"],
    queryFn: fetchMyOrders,
    retry: false,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) =>
      OrderControllerService.cancelOrder({ orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      showToast("Đã hủy đơn hàng chờ.");
    },
    onError: () => {
      showToast("Không thể hủy đơn hàng.");
    },
  });

  const handleCancelPendingOrder = (): void => {
    if (!pendingOrder?.id) return;
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn hủy đơn hàng chờ không?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: () => cancelOrderMutation.mutate(String(pendingOrder.id)),
      },
    ]);
  };

  const cartItems = useMemo<CartItemCardData[]>(() => {
    const payload: CartApi | undefined = cartQuery.data;
    return (payload?.items ?? []).map(mapCartItem).filter((item) => {
      return item.cartItemId.length > 0 && item.courseId.length > 0;
    });
  }, [cartQuery.data]);

  const totalPrice = useMemo<number>(() => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  }, [cartItems]);

  const pendingOrder = useMemo<OrderApi | undefined>(() => {
    return (ordersQuery.data ?? []).find((order) =>
      isPendingOrderStatus(order.status),
    );
  }, [ordersQuery.data]);

  const pendingOrderTotal = useMemo<number>(() => {
    const raw = Number(
      pendingOrder?.totalAmount ?? pendingOrder?.total_amount ?? 0,
    );

    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }, [pendingOrder?.totalAmount, pendingOrder?.total_amount]);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([cartQuery.refetch(), ordersQuery.refetch()]);

      return () => {
        // no-op
      };
    }, [cartQuery, ordersQuery]),
  );

  const handleRemoveCartItem = async (
    item: CartItemCardData,
  ): Promise<void> => {
    if (removeItemMutation.isPending) {
      return;
    }

    try {
      await removeItemMutation.mutateAsync(item.cartItemId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["cart", "badge"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "my-orders"] }),
      ]);
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể xóa khỏi giỏ hàng."));
    }
  };

  const handleSwipeableWillOpen = (openId: string): void => {
    Object.entries(swipeableRefs.current).forEach(([id, ref]) => {
      if (id !== openId) {
        ref?.close();
      }
    });
  };

  const handleCheckout = async (): Promise<void> => {
    if (checkoutMutation.isPending) {
      return;
    }

    const latestOrders = await ordersQuery.refetch();
    const latestPendingOrder = (latestOrders.data ?? []).find((order) =>
      isPendingOrderStatus(order.status),
    );

    if (latestPendingOrder?.id) {
      navigation.navigate("Checkout", {
        orderId: String(latestPendingOrder.id),
      });
      return;
    }

    if (cartItems.length === 0) {
      return;
    }

    try {
      const response = await checkoutMutation.mutateAsync(undefined);
      const orderId = String(response?.id ?? "");

      if (!orderId) {
        showToast("Không lấy được thông tin đơn hàng.");
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", "my-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
      ]);

      await ordersQuery.refetch();

      navigation.navigate("Checkout", { orderId });
    } catch (error) {
      const refreshedOrders = await ordersQuery.refetch();
      const pendingFromRefetch = (refreshedOrders.data ?? []).find((order) =>
        isPendingOrderStatus(order.status),
      );

      if (pendingFromRefetch?.id) {
        navigation.navigate("Checkout", {
          orderId: String(pendingFromRefetch.id),
        });
        return;
      }

      showToast(
        getApiErrorMessage(error, "Thanh toán thất bại. Vui lòng thử lại."),
      );
    }
  };

  const handlePressCourse = (item: CartItemCardData): void => {
    navigation.navigate("CourseDetail", { courseId: item.courseId });
  };

  const handleExplore = (): void => {
    navigation.navigate("MainTabs", { screen: "Explore" });
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([cartQuery.refetch(), ordersQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (cartQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-transparent" edges={["top", "bottom"]}>
        <AppScreenBackground />
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text className="text-sm font-medium text-slate-500">
            Đang tải giỏ hàng...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-transparent" edges={["top", "bottom"]}>
        <AppScreenBackground />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={36} color="#94a3b8" />
          <Text className="mt-4 text-center text-base font-bold text-slate-800">
            Không thể tải giỏ hàng
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Vui lòng kiểm tra kết nối và thử lại.
          </Text>

          <Pressable
            onPress={() => {
              void cartQuery.refetch();
            }}
            className="mt-6 rounded-full bg-slate-900 px-6 py-3"
          >
            <Text className="text-sm font-bold text-white">Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={["top", "bottom"]}>
      <AppScreenBackground />

      <View className="px-4 pb-2 pt-2">
        <View
          className="overflow-hidden rounded-2xl px-4 py-3"
          style={styles.glassPanel}
        >
          <BlurView
            intensity={26}
            tint="light"
            style={StyleSheet.absoluteFillObject}
          />
          <Text className="text-2xl font-black tracking-tight text-slate-800">
            Giỏ hàng
          </Text>
        </View>
      </View>

      {cartItems.length === 0 && !pendingOrder ? (
        <EmptyCartState onExplore={handleExplore} />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-64 pt-2"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void onRefresh();
                }}
                tintColor="#8b5cf6"
              />
            }
          >
            {pendingOrder ? (
              <View className="mb-4 rounded-[28px] border border-amber-200/80 bg-amber-50/80 p-5">
                <Text className="text-base font-black text-amber-700">
                  Bạn đang có đơn chờ thanh toán
                </Text>
                <Text className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
                  Bạn hiện có đơn hàng chưa thanh toán. Bạn có thể tiếp tục
                  thanh toán hoặc hủy đơn để mua lại.
                </Text>
                <Pressable
                  onPress={handleCancelPendingOrder}
                  disabled={cancelOrderMutation.isPending}
                  className={`mt-4 self-start rounded-xl px-4 py-2 ${cancelOrderMutation.isPending ? "bg-red-50" : "bg-red-100"}`}
                >
                  <Text
                    className={`text-xs font-bold ${cancelOrderMutation.isPending ? "text-red-400" : "text-red-700"}`}
                  >
                    {cancelOrderMutation.isPending
                      ? "Đang hủy..."
                      : "Hủy đơn chờ"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {cartItems.length > 0
              ? cartItems.map((item) => (
                  <CartItemCard
                    key={item.cartItemId}
                    item={item}
                    onPress={handlePressCourse}
                    onRemove={handleRemoveCartItem}
                    onSwipeableWillOpen={handleSwipeableWillOpen}
                    setSwipeableRef={(instance) => {
                      if (instance) {
                        swipeableRefs.current[item.cartItemId] = instance;
                        return;
                      }

                      delete swipeableRefs.current[item.cartItemId];
                    }}
                  />
                ))
              : null}

            <View
              className="mt-2 overflow-hidden rounded-[28px] border border-white/75 bg-white/70 p-5"
              style={styles.glassCard}
            >
              <BlurView
                intensity={26}
                tint="light"
                style={StyleSheet.absoluteFillObject}
              />
              <Text className="mb-3 text-base font-bold text-slate-800">
                Chi tiết thanh toán
              </Text>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-slate-500">
                  {pendingOrder && cartItems.length === 0
                    ? `Đơn chờ #${pendingOrder.id ?? "-"}`
                    : `Tạm tính (${cartItems.length} khóa học)`}
                </Text>
                <Text className="text-sm font-bold text-slate-800">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(
                    pendingOrder && cartItems.length === 0
                      ? pendingOrderTotal
                      : totalPrice,
                  )}
                </Text>
              </View>
            </View>
          </ScrollView>

          <CartSummaryBar
            totalPrice={
              pendingOrder && cartItems.length === 0
                ? pendingOrderTotal
                : totalPrice
            }
            onCheckout={() => {
              void handleCheckout();
            }}
            onContinuePendingCheckout={(orderId) => {
              navigation.navigate("Checkout", { orderId: String(orderId) });
            }}
            isLoading={checkoutMutation.isPending}
            pendingOrder={pendingOrder}
            disabled={cartItems.length === 0 && !pendingOrder}
            bottomInset={insets.bottom + 8}
            bottomOffset={FLOATING_TAB_BAR_RESERVED_SPACE}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassPanel: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    width: "34%",
  },
  glassCard: {
    shadowColor: "#1f2937",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});
