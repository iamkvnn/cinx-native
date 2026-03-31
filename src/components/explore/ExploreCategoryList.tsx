import { type ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import type { ExploreCategory } from "../../types/explore";

type ExploreCategoryListProps = {
  categories: ExploreCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
};

export default function ExploreCategoryList({
  categories,
  activeCategoryId,
  onSelectCategory,
}: ExploreCategoryListProps): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pb-1 mt-3"
      contentContainerClassName="px-6"
    >
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;

        return (
          <Pressable
            key={category.id}
            onPress={() => onSelectCategory(category.id)}
            style={[
              styles.chipBase,
              isActive ? styles.chipActive : styles.chipInactive,
            ]}
            className="mr-3 rounded-full px-5 py-2.5"
          >
            <Text
              className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-600"}`}
            >
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipBase: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chipActive: {
    backgroundColor: "rgba(167, 139, 250, 0.8)",
    borderColor: "transparent",
  },
  chipInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
