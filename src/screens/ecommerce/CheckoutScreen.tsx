import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import OrderSummaryCard from "../../components/domain/ecommerce/OrderSummaryCard";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "../../components/domain/ecommerce/PaymentMethodSelector";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { fetchCurrentUser } from "../../services/api/authApi";
import {
  checkPaymentPaid,
  confirmPayment,
} from "../../services/api/orderApi";
import { useAuthStore } from "../../store/useAuthStore";
import { VoucherControllerService } from "../../services/api/VoucherControllerService";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { CartControllerService } from "../../services/api/CartControllerService";
import { OrderControllerService } from "../../services/api/OrderControllerService";
import type { CartItemDto, CourseResponse, VoucherResponse } from "@/types";

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
  const [isWaitingPaymentResult, setIsWaitingPaymentResult] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherResponse | null>(null);
  const [voucherHint, setVoucherHint] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const paidHandledRef = useRef(false);

  const { courseId, fromCart, selectedCartItemIds } = route.params;

  const checkoutDataQuery = useQuery({
    queryKey: ["checkout-data", { courseId, fromCart }],
    queryFn: async () => {
      if (courseId) {
        const res = await CourseControllerService.getCourseById({ id: courseId });
        if (!res.data) throw new Error("Không tìm thấy khóa học.");
        return {
          items: [{ 
            id: String(res.data.id), 
            course: res.data as unknown as CourseResponse 
          } as CartItemDto],
          type: "single"
        };
      } else if (fromCart) {
        const res = await CartControllerService.getCart();
        let items = res.data || [];
        
        // Filter by selected IDs if provided
        if (selectedCartItemIds && selectedCartItemIds.length > 0) {
          items = items.filter(item => selectedCartItemIds.includes(String(item.id)));
        }

        return {
          items: items.map(item => ({
            id: String(item.id),
            course: item.course as CourseResponse
          })) as CartItemDto[],
          type: "cart"
        };
      }
      throw new Error("Không có thông tin thanh toán.");
    },
  });

  const checkoutItems = checkoutDataQuery.data?.items ?? [];

  const subtotalAmount = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const price = Number(item.course?.discountedPrice ?? item.course?.price ?? 0);
      return sum + price;
    }, 0);
  }, [checkoutItems]);

  const voucherDiscountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    
    const discountType = String(appliedVoucher.discountType ?? "").toUpperCase();
    const discountValue = Number(appliedVoucher.discountValue ?? 0);
    const maxDiscount = Number(appliedVoucher.maxDiscountAmount ?? Infinity);

    if (discountType === "FIXED") {
      return Math.min(discountValue, subtotalAmount);
    } else if (discountType === "PERCENTAGE") {
      const calculated = (subtotalAmount * discountValue) / 100;
      return Math.min(calculated, maxDiscount, subtotalAmount);
    }
    
    return 0;
  }, [appliedVoucher, subtotalAmount]);

  const finalPrice = Math.max(0, subtotalAmount - voucherDiscountAmount);

  const finalizePaidOrder = async (): Promise<void> => {
    if (paidHandledRef.current) return;
    paidHandledRef.current = true;
    setIsWaitingPaymentResult(false);

    const invalidations = [
      queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["cart", "badge"] }),
      queryClient.invalidateQueries({ queryKey: ["orders", "my-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
    ];

    if (fromCart) {
      try {
        if (selectedCartItemIds && selectedCartItemIds.length > 0) {
          await CartControllerService.removeFromCart1({ itemIds: selectedCartItemIds });
        } else {
          await CartControllerService.clearCart();
        }
      } catch (err) {
        console.warn("Failed to clear/update cart after checkout:", err);
      }
    }

    await Promise.all(invalidations);

    try {
      const freshUser = await fetchCurrentUser();
      useAuthStore.getState().setUser(freshUser);
    } catch {
      // Ignore
    }

    notify("Thanh toán thành công!");
    navigation.replace("MainTabs", { screen: "MyLearning" });
  };

  useEffect(() => {
    if (!isWaitingPaymentResult || !createdOrderId) return;

    const backendMethod = selectedMethod === "momo" ? "MOMO" : "VN_PAY";

    const syncPaymentStatus = async (): Promise<void> => {
      const paid = await checkPaymentPaid(createdOrderId, backendMethod);
      if (paid) {
        await finalizePaidOrder();
      }
    };

    const intervalId = setInterval(() => {
      void syncPaymentStatus();
    }, 5000);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncPaymentStatus();
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [isWaitingPaymentResult, createdOrderId, selectedMethod]);

  const handleConfirmPayment = async (): Promise<void> => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      
      // 1. Create order
      const orderResponse = await OrderControllerService.createOrder({
        requestBody: {
          cartItems: checkoutItems,
          paymentMethod: selectedMethod === "momo" ? "MOMO" : "VN_PAY",
          voucherCode: appliedVoucher?.code || undefined,
        }
      });

      const order = orderResponse.data;
      if (!order?.id) throw new Error("Không thể tạo đơn hàng.");

      const orderId = String(order.id);
      setCreatedOrderId(orderId);

      // 2. Confirm payment
      const result = await confirmPayment(orderId, {
        useRewardPoints: false,
        paymentMethod: selectedMethod === "momo" ? "MOMO" : "VN_PAY",
        skipCheckExisting: true,
      });

      if (!result.isPaid) {
        setIsWaitingPaymentResult(true);
        if (result.paymentUrl) {
          const canOpen = await Linking.canOpenURL(result.paymentUrl);
          if (canOpen) {
            await Linking.openURL(result.paymentUrl);
          }
          notify("Đã tạo phiên thanh toán. Vui lòng hoàn tất thanh toán trên cổng thanh toán.");
        } else {
          notify("Đã gửi yêu cầu thanh toán. Vui lòng kiểm tra lại trạng thái đơn hàng.");
        }
      } else {
        await finalizePaidOrder();
      }
    } catch (error) {
      Alert.alert(
        "Thanh toán thất bại",
        getApiErrorMessage(error, "Không thể xác nhận thanh toán."),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyVoucher = async (): Promise<void> => {
    if (isApplyingVoucher) return;
    const code = voucherCodeInput.trim();
    if (!code) {
      setVoucherHint("Vui lòng nhập mã voucher.");
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherHint("");

      const res = await VoucherControllerService.getVoucherByCode({ code });
      const voucher = res.data;

      if (!voucher) {
        setVoucherHint("Không tìm thấy voucher.");
        return;
      }

      const minPurchase = Number(voucher.minPurchaseAmount ?? 0);
      if (minPurchase > 0 && subtotalAmount < minPurchase) {
        setVoucherHint(`Đơn hàng cần tối thiểu ${formatVnd(minPurchase)} để áp dụng mã này.`);
        return;
      }

      const now = Date.now();
      const validFrom = voucher.validFrom ? new Date(voucher.validFrom).getTime() : null;
      const validTo = voucher.validTo ? new Date(voucher.validTo).getTime() : null;

      if (validFrom && now < validFrom) {
        setVoucherHint("Voucher chưa đến thời gian áp dụng.");
        return;
      }
      if (validTo && now > validTo) {
        setVoucherHint("Voucher đã hết hạn.");
        return;
      }

      setAppliedVoucher(voucher);
      setVoucherHint(`Đã áp dụng voucher ${code.toUpperCase()}.`);
    } catch (error) {
      setVoucherHint(getApiErrorMessage(error, "Không thể áp dụng voucher."));
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    setVoucherHint("Đã bỏ voucher.");
  };

  if (checkoutDataQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (checkoutDataQuery.isError || !checkoutDataQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-8">
        <AppScreenBackground />
        <Text className="text-center text-base font-bold text-slate-800">
          {getApiErrorMessage(checkoutDataQuery.error, "Không thể tải thông tin thanh toán.")}
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
            Thông tin đơn hàng
          </Text>
          <Text className="mt-2 text-xs font-semibold text-slate-500">
            {checkoutItems.length} khóa học đã chọn
          </Text>
        </View>

        <View className="mb-4 overflow-hidden rounded-[24px] border border-white/70 bg-white/75 p-4">
          <Text className="mb-3 text-sm font-bold text-slate-800">
            Khóa học ({checkoutItems.length})
          </Text>

          <View className="gap-3">
            {checkoutItems.map((item, index) => {
              const course = item.course;
              const title = course?.title ?? "Khóa học";
              const image = course?.images?.[0]?.imageUrl ?? FALLBACK_IMAGE;
              const instructor = course?.instructor?.name ?? "Giảng viên";
              const price = Number(course?.discountedPrice ?? course?.price ?? 0);

              return (
                <View key={String(item.id || index)} className="flex-row gap-3">
                  <Image source={{ uri: image }} className="h-16 w-16 rounded-xl" />
                  <View className="flex-1 justify-center">
                    <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                      {title}
                    </Text>
                    <Text className="mt-0.5 text-[11px] font-medium text-slate-500" numberOfLines={1}>
                      Giảng viên: {instructor}
                    </Text>
                    <Text className="mt-1 text-sm font-black text-violet-600">
                      {formatVnd(price)}
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

        <View className="mt-4 overflow-hidden rounded-[24px] border border-white/70 bg-white/75 p-4">
          <Text className="mb-3 text-sm font-bold text-slate-800">
            Mã giảm giá
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={voucherCodeInput}
              onChangeText={setVoucherCodeInput}
              placeholder="Nhập voucher"
              autoCapitalize="characters"
              editable={!appliedVoucher && !isApplyingVoucher}
              className={`h-11 flex-1 rounded-xl border px-3 text-sm font-semibold ${appliedVoucher ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-300 bg-white text-slate-800"}`}
            />
            {!appliedVoucher ? (
              <Pressable
                onPress={handleApplyVoucher}
                disabled={isApplyingVoucher}
                className={`h-11 items-center justify-center rounded-xl px-4 ${isApplyingVoucher ? "bg-violet-300" : "bg-violet-600"}`}
              >
                <Text className="text-xs font-bold text-white">
                  {isApplyingVoucher ? "Đang áp dụng..." : "Áp dụng"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleRemoveVoucher}
                className="h-11 items-center justify-center rounded-xl bg-red-500 px-4"
              >
                <Text className="text-xs font-bold text-white">Bỏ mã</Text>
              </Pressable>
            )}
          </View>
          {voucherHint ? (
            <Text className="mt-2 text-xs font-semibold text-slate-600">{voucherHint}</Text>
          ) : null}
        </View>

        <View className="mt-4">
          <OrderSummaryCard
            courseCount={checkoutItems.length}
            orderTotalPrice={subtotalAmount}
            coursePromotionDiscount={0}
            voucherCode={appliedVoucher?.code}
            voucherDiscountAmount={voucherDiscountAmount}
            finalPrice={finalPrice}
          />
        </View>
      </ScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-white/70 bg-white/90 px-4 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 16) }}
      >
        <View className="mb-3 flex-row items-center justify-between px-1">
          <Text className="text-sm font-bold text-slate-800">Tổng thanh toán:</Text>
          <View className="items-end">
            {voucherDiscountAmount > 0 ? (
              <Text className="text-xs font-semibold text-slate-400 line-through">
                {formatVnd(subtotalAmount)}
              </Text>
            ) : null}
            <Text className="text-2xl font-black text-violet-600">{formatVnd(finalPrice)}</Text>
          </View>
        </View>

        <Pressable
          onPress={handleConfirmPayment}
          disabled={isProcessing}
          className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${isProcessing ? "bg-violet-400" : "bg-violet-600"}`}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-base font-bold text-white">Thanh toán ngay</Text>
          )}
        </Pressable>

        <Text className="mt-3 text-center text-[10px] font-medium text-slate-400">
          Thanh toán an toàn qua cổng {selectedMethod.toUpperCase()}
        </Text>
      </View>
    </SafeAreaView>
  );
}
