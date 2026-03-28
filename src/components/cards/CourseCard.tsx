import type { ReactElement } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

interface CourseCardProps {
  title: string;
  price: number;
  imageUrl: string;
  onPress?: () => void;
}

export default function CourseCard({
  title,
  price,
  imageUrl,
  onPress,
}: CourseCardProps): ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4"
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-40 bg-gray-200"
        resizeMode="cover"
      />
      <View className="p-4">
        <Text
          className="text-base font-semibold text-slate-900 mb-2"
          numberOfLines={2}
        >
          {title}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-blue-600">
            {price.toLocaleString("vi-VN")} đ
          </Text>
          <TouchableOpacity className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-blue-600">Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
