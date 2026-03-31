import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { Text, View } from "react-native";

type CourseAboutTabProps = {
  description: string;
  expanded: boolean;
  onToggleExpanded: () => void;
};

const LEARN_ITEMS = [
  "Sử dụng thành thạo Figma từ cơ bản đến Auto Layout, Components.",
  "Quy trình thiết kế chuẩn UX Research, Wireframe, UI Design, Prototyping.",
  "Xây dựng Portfolio ấn tượng để ứng tuyển các công ty công nghệ.",
];

const INFO_BLOCKS = [
  {
    id: "duration",
    icon: "time-outline" as const,
    color: "#8b5cf6",
    title: "Thời lượng",
    value: "24 Giờ",
  },
  {
    id: "certificate",
    icon: "ribbon-outline" as const,
    color: "#f97316",
    title: "Chứng chỉ",
    value: "Cấp sau khóa học",
  },
  {
    id: "level",
    icon: "bar-chart-outline" as const,
    color: "#3b82f6",
    title: "Trình độ",
    value: "Người mới bắt đầu",
  },
  {
    id: "access",
    icon: "phone-portrait-outline" as const,
    color: "#ec4899",
    title: "Truy cập",
    value: "Trọn đời trên App/Web",
  },
];

export default function CourseAboutTab({
  description,
  expanded,
  onToggleExpanded,
}: CourseAboutTabProps): ReactElement {
  return (
    <View className="mt-4 gap-6">
      <View className="rounded-3xl border border-white/70 bg-white/65 p-5">
        <Text className="mb-4 text-lg font-bold text-slate-800">
          Bạn sẽ học được gì?
        </Text>
        {LEARN_ITEMS.map((item) => (
          <View key={item} className="mb-3 flex-row items-start gap-3">
            <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="checkmark" size={14} color="#16a34a" />
            </View>
            <Text className="flex-1 text-sm font-medium text-slate-600">
              {item}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-3">
        {INFO_BLOCKS.map((item) => (
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
          numberOfLines={expanded ? undefined : 4}
        >
          {description}
        </Text>
        <Text
          className="mt-2 text-sm font-bold text-violet-600"
          onPress={onToggleExpanded}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </Text>
      </View>
    </View>
  );
}
