import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
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
import type { CertificateRequestResponse, VoucherResponse } from "@/types";

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
    queryFn: () => CertificateControllerService.getMyCertificates(),
    retry: false,
  });

  const certificates = (certificatesQuery.data?.data ??
    []) as CertificateRequestResponse[];

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
          <View className="mx-6 my-6 items-center justify-center rounded-3xl border border-white/70 bg-white/70 py-12">
            <Ionicons name="ribbon" size={30} color="#a78bfa" />
            <Text className="mt-4 text-sm font-bold text-slate-700">
              Bạn chưa có chứng chỉ nào
            </Text>
          </View>
        ) : (
          <View className="mx-6 mb-10 gap-3">
            {certificates.map((certificate) => {
              const status = mapCertificateStatus(certificate.status);

              return (
                <View
                  key={String(
                    certificate.id ??
                      `${certificate.courseId}-${certificate.requestedAt}`,
                  )}
                  className="rounded-3xl border border-white/70 bg-white/75 p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-black text-slate-800">
                      Khóa học #{certificate.courseId ?? "--"}
                    </Text>
                    <Text
                      className={`text-xs font-bold ${status.colorClassName}`}
                    >
                      {status.label}
                    </Text>
                  </View>
                  <Text className="mt-2 text-xs text-slate-500">
                    Yêu cầu: {formatDate(certificate.requestedAt)}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    Duyệt: {formatDate(certificate.approvedAt)}
                  </Text>
                  <Text
                    className="mt-1 text-xs text-slate-500"
                    numberOfLines={1}
                  >
                    URL: {certificate.certificateUrl ?? "--"}
                  </Text>
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
          <View className="mx-6 my-6 items-center justify-center rounded-3xl border border-white/70 bg-white/70 py-12">
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
