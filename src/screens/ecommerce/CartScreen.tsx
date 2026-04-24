import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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
  useEffect,
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
  TouchableOpacity,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const swipeableRefs = useRef<Record<string, { close: () => void } | null>>(
    {},
  );

  const cartQuery = useQuery({
    queryKey: ["cart", "list"],
    queryFn: fetchCart,
  });

  const removeItemMutation = useMutation({
    mutationFn: removeFromCart,
  });

  const cartItems = useMemo<CartItemCardData[]>(() => {
    const payload: CartApi | undefined = cartQuery.data;
    return (payload?.items ?? []).map(mapCartItem).filter((item) => {
      return item.cartItemId.length > 0 && item.courseId.length > 0;
    });
  }, [cartQuery.data]);

  // Sync selectedIds with cartItems
  useEffect(() => {
    if (cartItems.length > 0 && selectedIds.size === 0) {
        // Default select all on first load if nothing selected? 
        // Better to just let user select.
    }
  }, [cartItems]);

  const selectedItems = useMemo(() => {
    return cartItems.filter(item => selectedIds.has(item.cartItemId));
  }, [cartItems, selectedIds]);

  const totalPrice = useMemo<number>(() => {
    return selectedItems.reduce((sum, item) => sum + item.price, 0);
  }, [selectedItems]);

  const allSelected = cartItems.length > 0 && selectedIds.size === cartItems.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map(i => i.cartItemId)));
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  useFocusEffect(
    useCallback(() => {
      void cartQuery.refetch();

      return () => {
        // no-op
      };
    }, [cartQuery]),
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
      ]);
      
      // Also remove from selected if it was there
      if (selectedIds.has(item.cartItemId)) {
          const newSelected = new Set(selectedIds);
          newSelected.delete(item.cartItemId);
          setSelectedIds(newSelected);
      }
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

  const handleCheckout = (): void => {
    if (selectedItems.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một khóa học để thanh toán.");
      return;
    }

    navigation.navigate("Checkout", { 
        fromCart: true,
        selectedCartItemIds: Array.from(selectedIds)
    });
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
      await cartQuery.refetch();
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

      <View className="px-4 pb-2 pt-2 flex-row items-center justify-between">
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

        {cartItems.length > 0 && (
            <TouchableOpacity 
                onPress={toggleSelectAll}
                className="flex-row items-center bg-white/40 px-3 py-2 rounded-xl border border-white/60"
            >
                <View className={`h-5 w-5 items-center justify-center rounded-full border-2 mr-2 ${allSelected ? 'border-violet-600 bg-violet-600' : 'border-slate-400'}`}>
                    {allSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text className="text-xs font-bold text-slate-700">Chọn tất cả</Text>
            </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
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
            {cartItems.map((item) => (
              <CartItemCard
                key={item.cartItemId}
                item={item}
                selected={selectedIds.has(item.cartItemId)}
                onToggleSelection={toggleSelection}
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
            ))}

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
                  Tạm tính ({selectedItems.length} khóa học đã chọn)
                </Text>
                <Text className="text-sm font-bold text-slate-800">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(totalPrice)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <CartSummaryBar
            totalPrice={totalPrice}
            onCheckout={() => {
              void handleCheckout();
            }}
            onContinuePendingCheckout={() => {
              navigation.navigate("Checkout", { 
        fromCart: true,
        selectedCartItemIds: Array.from(selectedIds)
    });
            }}
            isLoading={false}
            disabled={selectedItems.length === 0}
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
    alignSelf: 'flex-start',
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
