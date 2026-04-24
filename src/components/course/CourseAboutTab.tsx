import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { Text, View } from "react-native";

type CourseAboutTabProps = {
  description: string;
  duration?: number;
};

const INFO_BLOCKS = [
  {
    id: "duration",
    icon: "time-outline" as const,
    color: "#8b5cf6",
    title: "Thời lượng",
    value: "0 Giờ",
  },
  {
    id: "certificate",
    icon: "ribbon-outline" as const,
    color: "#f97316",
    title: "Chứng chỉ",
    value: "Cấp sau khóa học",
  },
];

export default function CourseAboutTab({
  description,
  duration,
}: CourseAboutTabProps): ReactElement {
  // Update duration block with actual duration
  const blocks = [...INFO_BLOCKS];
  if (duration) {
    blocks[0].value = `${duration} Phút`;
  }

  return (
    <View className="mt-4 gap-6">

      <View className="flex-row flex-wrap gap-3">
        {blocks.map((item) => (
          <View
            key={item.id}
            className="w-[48%] min-h-[118px] items-center justify-center rounded-3xl border border-white/70 bg-white/65 p-4"
          >
            <Ionicons name={item.icon} size={24} color={item.color} />
            <Text className="mt-2 text-xs font-semibold text-slate-500">
              {item.title}
            </Text>
            <Text className="mt-1 text-center text-sm font-bold text-slate-800">
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      <View>
        <Text className="mb-2 text-lg font-bold text-slate-800">
          Mô tả khóa học
        </Text>
        <Text
          className="text-sm font-medium leading-6 text-slate-600"
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
