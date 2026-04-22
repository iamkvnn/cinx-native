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
  cancelOrder,
  getOrderById,
  recreateOrderWithVoucher,
  type OrderDetailItemApi,
} from "../../services/api/orderApi";
import { useAuthStore } from "../../store/useAuthStore";
import { VoucherControllerService } from "../../services/api/VoucherControllerService";

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

const isPendingOrderStatus = (status: unknown): boolean => {
  return (
    String(status ?? "")
      .trim()
      .toLowerCase() === "pending"
  );
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
  const [isWaitingPaymentResult, setIsWaitingPaymentResult] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isRemovingVoucher, setIsRemovingVoucher] = useState(false);
  const [voucherHint, setVoucherHint] = useState("");
  const paidHandledRef = useRef(false);

  const orderId = String(route.params?.orderId ?? "").trim();
  const isValidOrderId = orderId.length > 0;

  const orderQuery = useQuery({
    queryKey: ["order", "detail", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: isValidOrderId,
    refetchInterval: isWaitingPaymentResult ? 5000 : false,
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

  const orderCode = `EDUF-${orderId.padStart(6, "0")}`;
  const isOrderPending = isPendingOrderStatus(orderQuery.data?.status);
  const appliedVoucherCode = String(
    orderQuery.data?.voucher?.code ?? "",
  ).trim();
  const voucherDiscountAmount = Math.max(
    0,
    Number(orderQuery.data?.voucher?.discountAmount ?? 0),
  );
  const serverDiscountAmount = Math.max(
    0,
    Number(orderQuery.data?.discounted ?? 0),
  );
  const coursePromotionDiscount = Math.max(
    0,
    serverDiscountAmount - voucherDiscountAmount,
  );
  const subtotalAfterServerDiscount = Math.max(
    0,
    totalAmount - serverDiscountAmount,
  );
  const rewardPointsDisabled = appliedVoucherCode.length > 0;
  const rewardPoints = Number(user?.rewardPoints ?? 0);
  const maxDiscount = rewardPoints * 1000;
  const rewardPointsDiscount =
    useRewardPoints && !rewardPointsDisabled
      ? Math.min(maxDiscount, subtotalAfterServerDiscount)
      : 0;
  const finalPrice = Math.max(
    0,
    subtotalAfterServerDiscount - rewardPointsDiscount,
  );

  useEffect(() => {
    setVoucherCodeInput(appliedVoucherCode);
  }, [appliedVoucherCode]);

  useEffect(() => {
    if (rewardPointsDisabled && useRewardPoints) {
      setUseRewardPoints(false);
    }
  }, [rewardPointsDisabled, useRewardPoints]);

  const finalizePaidOrder = async (): Promise<void> => {
    if (paidHandledRef.current) {
      return;
    }

    paidHandledRef.current = true;
    setIsWaitingPaymentResult(false);

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
  };

  useEffect(() => {
    if (!isWaitingPaymentResult || !isValidOrderId) {
      return;
    }

    const backendMethod = selectedMethod === "momo" ? "MOMO" : "VN_PAY";

    const syncPaymentStatus = async (): Promise<void> => {
      const paid = await checkPaymentPaid(orderId, backendMethod);

      if (paid) {
        await finalizePaidOrder();
        return;
      }

      await orderQuery.refetch();
    };

    const intervalId = setInterval(() => {
      void syncPaymentStatus();
    }, 5000);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncPaymentStatus();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [
    finalizePaidOrder,
    isValidOrderId,
    isWaitingPaymentResult,
    orderId,
    orderQuery,
    selectedMethod,
  ]);

  useEffect(() => {
    if (!isWaitingPaymentResult || paidHandledRef.current) {
      return;
    }

    if (!isOrderPending) {
      void finalizePaidOrder();
    }
  }, [isWaitingPaymentResult, isOrderPending]);

  const handleConfirmPayment = async (): Promise<void> => {
    if (!isValidOrderId || isProcessing) {
      return;
    }

    if (!isOrderPending) {
      notify("Đơn hàng không còn ở trạng thái chờ thanh toán.");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await confirmPayment(orderId, {
        useRewardPoints,
        paymentMethod: selectedMethod === "momo" ? "MOMO" : "VN_PAY",
      });

      if (!result.isPaid) {
        setIsWaitingPaymentResult(true);

        if (result.paymentUrl) {
          const canOpen = await Linking.canOpenURL(result.paymentUrl);

          if (canOpen) {
            await Linking.openURL(result.paymentUrl);
          }

          notify(
            "Đã tạo phiên thanh toán. Vui lòng hoàn tất thanh toán trên cổng thanh toán.",
          );
        } else {
          notify(
            "Đã gửi yêu cầu thanh toán. Vui lòng kiểm tra lại trạng thái đơn hàng.",
          );
        }

        await queryClient.invalidateQueries({
          queryKey: ["order", "detail", orderId],
        });
        return;
      }

      await finalizePaidOrder();
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
    if (!isOrderPending || isApplyingVoucher || isRemovingVoucher) {
      return;
    }

    const code = voucherCodeInput.trim();

    if (!code) {
      setVoucherHint("Vui lòng nhập mã voucher.");
      return;
    }

    if (
      appliedVoucherCode &&
      appliedVoucherCode.toLowerCase() === code.toLowerCase()
    ) {
      setVoucherHint("Voucher này đã được áp dụng.");
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherHint("");

      const voucherResponse = await VoucherControllerService.getVoucherByCode({
        code,
      });
      const voucher = voucherResponse.data;

      if (!voucher) {
        setVoucherHint("Không tìm thấy voucher.");
        return;
      }

      const minPurchase = Number(voucher.minPurchaseAmount ?? 0);
      if (minPurchase > 0 && totalAmount < minPurchase) {
        setVoucherHint(
          `Đơn hàng cần tối thiểu ${formatVnd(minPurchase)} để áp dụng mã này.`,
        );
        return;
      }

      const now = Date.now();
      const validFrom = voucher.validFrom
        ? new Date(voucher.validFrom).getTime()
        : null;
      const validTo = voucher.validTo
        ? new Date(voucher.validTo).getTime()
        : null;

      if (validFrom && Number.isFinite(validFrom) && now < validFrom) {
        setVoucherHint("Voucher chưa đến thời gian áp dụng.");
        return;
      }

      if (validTo && Number.isFinite(validTo) && now > validTo) {
        setVoucherHint("Voucher đã hết hạn.");
        return;
      }

      const recreated = await recreateOrderWithVoucher({
        orderId,
        voucherCode: code,
        paymentMethod: selectedMethod === "momo" ? "MOMO" : "VN_PAY",
      });

      setUseRewardPoints(false);
      setVoucherHint(`Đã áp dụng voucher ${code.toUpperCase()}.`);
      navigation.replace("Checkout", { orderId: String(recreated.id ?? "") });
    } catch (error) {
      setVoucherHint(getApiErrorMessage(error, "Không thể áp dụng voucher."));
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = async (): Promise<void> => {
    if (
      !isOrderPending ||
      !appliedVoucherCode ||
      isApplyingVoucher ||
      isRemovingVoucher
    ) {
      return;
    }

    try {
      setIsRemovingVoucher(true);
      setVoucherHint("");

      const recreated = await recreateOrderWithVoucher({
        orderId,
        voucherCode: undefined,
        paymentMethod: selectedMethod === "momo" ? "MOMO" : "VN_PAY",
      });

      setVoucherCodeInput("");
      setVoucherHint("Đã bỏ voucher khỏi đơn hàng.");
      navigation.replace("Checkout", { orderId: String(recreated.id ?? "") });
    } catch (error) {
      setVoucherHint(getApiErrorMessage(error, "Không thể bỏ voucher."));
    } finally {
      setIsRemovingVoucher(false);
    }
  };

  const handleCancelOrder = (): void => {
    if (!isValidOrderId || isProcessing) {
      return;
    }

    Alert.alert("Hủy đơn hàng", "Bạn có chắc muốn hủy đơn hàng này?", [
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
              notify("Đã hủy đơn hàng.");
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                "Hủy đơn thất bại",
                getApiErrorMessage(error, "Không thể hủy đơn hàng."),
              );
            } finally {
              setIsProcessing(false);
            }
          })();
        },
      },
    ]);
  };

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (!isValidOrderId) {
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
                item.course?.images?.[0]?.imageUrl ?? FALLBACK_IMAGE;
              const instructor = item.course?.instructor?.name ?? "Giảng viên";
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
              editable={
                isOrderPending &&
                !isApplyingVoucher &&
                !isRemovingVoucher &&
                !Boolean(appliedVoucherCode)
              }
              className={`h-11 flex-1 rounded-xl border px-3 text-sm font-semibold ${appliedVoucherCode ? "border-slate-200 bg-slate-100 text-slate-500" : "border-slate-300 bg-white text-slate-800"}`}
            />
            {!appliedVoucherCode ? (
              <Pressable
                onPress={() => {
                  void handleApplyVoucher();
                }}
                disabled={
                  !isOrderPending || isApplyingVoucher || isRemovingVoucher
                }
                className={`h-11 items-center justify-center rounded-xl px-4 ${!isOrderPending || isApplyingVoucher || isRemovingVoucher ? "bg-violet-300" : "bg-violet-600"}`}
              >
                <Text className="text-xs font-bold text-white">
                  {isApplyingVoucher ? "Đang áp dụng..." : "Áp dụng"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  void handleRemoveVoucher();
                }}
                disabled={
                  !isOrderPending || isApplyingVoucher || isRemovingVoucher
                }
                className={`h-11 items-center justify-center rounded-xl px-4 ${!isOrderPending || isApplyingVoucher || isRemovingVoucher ? "bg-red-200" : "bg-red-500"}`}
              >
                <Text className="text-xs font-bold text-white">
                  {isRemovingVoucher ? "Đang bỏ..." : "Bỏ mã"}
                </Text>
              </Pressable>
            )}
          </View>

          {voucherHint ? (
            <Text className="mt-2 text-xs font-semibold text-slate-600">
              {voucherHint}
            </Text>
          ) : null}
        </View>

        <View className="mt-4">
          <OrderSummaryCard
            orderCode={orderCode}
            courseCount={orderItems.length}
            orderTotalPrice={totalAmount}
            coursePromotionDiscount={coursePromotionDiscount}
            voucherCode={appliedVoucherCode || undefined}
            voucherDiscountAmount={voucherDiscountAmount}
            rewardPoints={rewardPoints}
            useRewardPoints={useRewardPoints}
            rewardPointsDiscount={rewardPointsDiscount}
            finalPrice={finalPrice}
            rewardPointsDisabled={rewardPointsDisabled}
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
            {serverDiscountAmount > 0 || useRewardPoints ? (
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
          disabled={isProcessing || !isOrderPending}
          className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${isProcessing || !isOrderPending ? "bg-violet-400" : "bg-violet-600"}`}
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
