import { type ReactElement } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export type OrderFilterTab = "ALL" | "COMPLETED" | "PENDING" | "CANCELLED";

interface OrderStatusFilterProps {
  activeTab: OrderFilterTab;
  onTabSelect: (tab: OrderFilterTab) => void;
}

const TAB_ITEMS: Array<{ id: OrderFilterTab; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "COMPLETED", label: "Đã thanh toán" },
  { id: "PENDING", label: "Đang chờ" },
  { id: "CANCELLED", label: "Đã hủy" },
];

export default function OrderStatusFilter({
  activeTab,
  onTabSelect,
}: OrderStatusFilterProps): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4 pb-2"
      className="w-full"
    >
      {TAB_ITEMS.map((item) => {
        const isActive = item.id === activeTab;

        return (
          <Pressable
            key={item.id}
            onPress={() => onTabSelect(item.id)}
            className={`rounded-full border px-5 py-2 ${isActive ? "border-violet-200 bg-white" : "border-transparent bg-transparent"}`}
          >
            <Text
              className={`text-sm font-bold ${isActive ? "text-violet-600" : "text-slate-500"}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      <View className="w-1" />
    </ScrollView>
  );
}
