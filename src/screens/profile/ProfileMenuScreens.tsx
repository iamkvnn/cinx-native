import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CertificateControllerService } from "../../services/api/CertificateControllerService";
import { VoucherControllerService } from "../../services/api/VoucherControllerService";
import { fetchMyCertificates } from "../../services/api/myLearningApi";
import type { CertificateRequestResponse, VoucherResponse } from "@/types";
import type { CompletedCourse } from "../../types/myLearning";

type CertificateScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "MyCertificates"
>;

type VoucherScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Vouchers"
>;

const formatDate = (value: string | undefined): string => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("vi-VN");
};

const mapCertificateStatus = (
  status: CertificateRequestResponse["status"],
): { label: string; colorClassName: string } => {
  if (status === "APPROVED") {
    return { label: "Đã cấp", colorClassName: "text-emerald-600" };
  }

  if (status === "REJECTED") {
    return { label: "Từ chối", colorClassName: "text-red-600" };
  }

  return { label: "Chờ duyệt", colorClassName: "text-amber-600" };
};

export function MyCertificatesScreen(
  props: CertificateScreenProps,
): ReactElement {
  const certificatesQuery = useQuery({
    queryKey: ["profile", "my-certificates"],
    queryFn: () => fetchMyCertificates(),
    retry: false,
  });

  const certificates = (Array.isArray(certificatesQuery.data)
    ? certificatesQuery.data
    : []) as CompletedCourse[];

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />
      <View className="px-4 pt-3 pb-2">
        <Pressable
          onPress={() => props.navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/80"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={certificatesQuery.isRefetching}
            onRefresh={() => {
              void certificatesQuery.refetch();
            }}
          />
        }
      >
        <View className="mx-6 mb-4">
          <Text className="text-lg font-black text-slate-800">
            Chứng chỉ của tôi
          </Text>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            Danh sách chứng chỉ và trạng thái xét duyệt
          </Text>
        </View>

        {certificatesQuery.isLoading ? (
          <View className="mx-6 my-6 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#9333ea" />
          </View>
        ) : certificates.length === 0 ? (
          <View className="mx-6 mb-6 flex-1 items-center justify-center rounded-3xl border border-white/70 bg-white/70 py-12">
            <Ionicons name="ribbon" size={30} color="#a78bfa" />
            <Text className="mt-4 text-sm font-bold text-slate-700">
              Bạn chưa có chứng chỉ nào
            </Text>
          </View>
        ) : (
          <View className="mx-6 mb-10 gap-4">
            {certificates.map((certificate) => {
              const isApproved = certificate.statusLabel === "Đã cấp chứng chỉ";
              const isRejected = certificate.statusLabel === "Bị từ chối";

              return (
                <View
                  key={certificate.id}
                  className="overflow-hidden rounded-[24px] bg-white/80 p-3"
                  style={{
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.8)",
                  }}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="h-20 w-20 shadow-sm">
                      <View className="absolute inset-0 items-center justify-center rounded-2xl bg-slate-100">
                        <Ionicons name="image-outline" size={24} color="#94a3b8" />
                      </View>
                      {certificate.imageUrl ? (
                        <Image
                          source={{ uri: certificate.imageUrl }}
                          className="h-full w-full rounded-2xl"
                          resizeMode="cover"
                        />
                      ) : null}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <View
                          className={`rounded-full px-2 py-0.5 ${
                            isApproved
                              ? "bg-emerald-50"
                              : isRejected
                                ? "bg-red-50"
                                : "bg-amber-50"
                          }`}
                        >
                          <Text
                            className={`text-[9px] font-black uppercase tracking-wider ${
                              isApproved
                                ? "text-emerald-600"
                                : isRejected
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {certificate.statusLabel}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className="mt-1 text-[15px] font-black leading-tight text-slate-800"
                        numberOfLines={2}
                      >
                        {certificate.title}
                      </Text>

                      <View className="mt-2 flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={12} color="#94a3b8" />
                        <Text className="text-[10px] font-bold text-slate-400">
                          {certificate.completedDate}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export function VouchersScreen(props: VoucherScreenProps): ReactElement {
  const vouchersQuery = useQuery({
    queryKey: ["profile", "vouchers"],
    queryFn: () =>
      VoucherControllerService.getVouchers({
        page: 1,
        size: 30,
      }),
    retry: false,
  });

  const vouchers = (vouchersQuery.data?.data ?? []) as VoucherResponse[];

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />
      <View className="px-4 pt-3 pb-2">
        <Pressable
          onPress={() => props.navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/80"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={vouchersQuery.isRefetching}
            onRefresh={() => {
              void vouchersQuery.refetch();
            }}
          />
        }
      >
        <View className="mx-6 mb-4">
          <Text className="text-lg font-black text-slate-800">Mã giảm giá</Text>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            Voucher đang hoạt động từ hệ thống
          </Text>
        </View>

        {vouchersQuery.isLoading ? (
          <View className="mx-6 my-6 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#9333ea" />
          </View>
        ) : vouchers.length === 0 ? (
          <View className="mx-6 mb-6 flex-1 items-center justify-center rounded-3xl border border-white/70 bg-white/70 py-12">
            <Ionicons name="ticket" size={30} color="#ec4899" />
            <Text className="mt-4 text-sm font-bold text-slate-700">
              Chưa có voucher nào
            </Text>
          </View>
        ) : (
          <View className="mx-6 mb-10 gap-3">
            {vouchers.map((voucher) => (
              <View
                key={String(voucher.id ?? voucher.code)}
                className="rounded-3xl border border-white/70 bg-white/75 p-4"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="text-sm font-black text-slate-800">
                    {voucher.code ?? "--"}
                  </Text>
                  <Text className="text-xs font-bold text-pink-600">
                    -
                    {Number(voucher.discountAmount ?? 0).toLocaleString(
                      "vi-VN",
                    )}
                  </Text>
                </View>
                <Text className="mt-2 text-xs text-slate-500">
                  {voucher.description ?? "Không có mô tả"}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Tối thiểu:{" "}
                  {Number(voucher.minPurchaseAmount ?? 0).toLocaleString(
                    "vi-VN",
                  )}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Hiệu lực: {formatDate(voucher.validFrom)} -{" "}
                  {formatDate(voucher.validTo)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
