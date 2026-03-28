import type { ReactElement } from "react";
import { View, Text } from "react-native";

export default function CourseDetailScreen(): ReactElement {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-slate-900">
        CourseDetailScreen
      </Text>
      <Text className="text-sm text-slate-500 mt-2">
        Chi Tiết Khóa Học / Course Detail
      </Text>
    </View>
  );
}
