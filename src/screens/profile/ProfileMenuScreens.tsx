import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactElement } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type PlaceholderScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "MyCertificates"
>;

export function MyCertificatesScreen(
  _props: PlaceholderScreenProps,
): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-6 my-6 items-center justify-center py-12">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <Ionicons name="star" size={32} color="#9333ea" />
          </View>
          <Text className="text-lg font-bold text-slate-800">
            Chứng chỉ của tôi
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Các chứng chỉ hoàn thành khóa học sẽ xuất hiện tại đây
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function DownloadedFilesScreen(): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-6 my-6 items-center justify-center py-12">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="cloud-download" size={32} color="#2563eb" />
          </View>
          <Text className="text-lg font-bold text-slate-800">
            Tài liệu đã tải
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Các tài liệu bạn tải về sẽ được lưu tại đây
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function OrderHistoryScreen(): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-6 my-6 items-center justify-center py-12">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-violet-100">
            <Ionicons name="receipt" size={32} color="#9333ea" />
          </View>
          <Text className="text-lg font-bold text-slate-800">
            Lịch sử đơn hàng
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Các đơn mua hàng của bạn sẽ xuất hiện tại đây
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function VouchersScreen(): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-6 my-6 items-center justify-center py-12">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <Ionicons name="ticket" size={32} color="#ec4899" />
          </View>
          <Text className="text-lg font-bold text-slate-800">Mã giảm giá</Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Các vouchers có sẵn của bạn sẽ hiển thị tại đây
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function PaymentMethodsScreen(): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-6 my-6 items-center justify-center py-12">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Ionicons name="card" size={32} color="#059669" />
          </View>
          <Text className="text-lg font-bold text-slate-800">
            Phương thức thanh toán
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Quản lý các phương thức thanh toán của bạn tại đây
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function HelpCenterScreen(): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-6 my-6 items-center justify-center py-12">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <Ionicons name="help-circle" size={32} color="#4f46e5" />
          </View>
          <Text className="text-lg font-bold text-slate-800">
            Trung tâm trợ giúp
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500">
            Tìm kiếm câu trả lời và hỗ trợ từ đội ngũ của chúng tôi
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
