import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchExploreDataMock } from "../../services/api/exploreApi";
import type { ExploreCourseItem } from "../../types/explore";

function CourseItemCard({ item }: { item: ExploreCourseItem }): ReactElement {
  const isFree = item.priceLabel.toLowerCase() === "free";

  return (
    <Pressable
      style={styles.courseItemCard}
      className="mb-4 flex-row items-center gap-3 rounded-[28px] p-2.5"
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="h-24 w-24 rounded-2xl"
        resizeMode="cover"
      />

      <View className="flex-1 py-1 pr-1">
        <View className="mb-1 flex-row items-start justify-between">
          <Text className="rounded-md bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-500">
            {item.categoryLabel}
          </Text>
          <Text
            className={`text-sm font-black ${isFree ? "text-emerald-600" : "text-slate-800"}`}
          >
            {item.priceLabel}
          </Text>
        </View>

        <Text
          className="mb-1 text-sm font-bold leading-tight text-slate-800"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          className="mb-2 text-[11px] font-medium text-slate-500"
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>

        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            <Text className="text-[10px] font-bold text-slate-400">
              {item.durationLabel}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text className="text-[10px] font-bold text-slate-400">
              {item.rating}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen(): ReactElement {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore-data"],
    queryFn: fetchExploreDataMock,
  });

  const stickyOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const filteredCourses = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.newestCourses.filter((item) => {
      const matchCategory =
        activeCategoryId === "all" || item.categoryId === activeCategoryId;
      const keyword = searchKeyword.trim().toLowerCase();
      const matchSearch =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        item.subtitle.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [activeCategoryId, data, searchKeyword]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-3 text-sm font-semibold text-slate-500">
          Đang tải khám phá...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-red-500">
          Không thể tải dữ liệu Explore.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pb-2 pt-2">
          <Text className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Thư viện
          </Text>
          <Text className="text-4xl font-black tracking-tight text-slate-800">
            Khám phá
          </Text>
        </View>

        <View className="px-6 py-3">
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: stickyOpacity,
              ...StyleSheet.absoluteFillObject,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28,
              overflow: "hidden",
            }}
          >
            <BlurView intensity={34} tint="light" style={styles.blurFill} />
            <View className="h-full w-full border-b border-white/30 bg-white/65" />
          </Animated.View>

          <View className="relative z-10 flex-row items-center gap-3">
            <View
              style={styles.searchShell}
              className="flex-1 flex-row items-center rounded-2xl px-3"
            >
              <Ionicons name="search" size={16} color="#94a3b8" />
              <TextInput
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                placeholder="Tìm khóa học, tác giả..."
                placeholderTextColor="#94a3b8"
                className="ml-2 flex-1 py-3.5 text-sm font-semibold text-slate-800"
              />
            </View>

            <Pressable
              style={styles.searchShell}
              className="h-12 w-12 items-center justify-center rounded-2xl"
            >
              <Ionicons name="options-outline" size={18} color="#475569" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pb-1"
          contentContainerClassName="px-6"
        >
          {data.categories.map((category) => {
            const isActive = activeCategoryId === category.id;

            return (
              <Pressable
                key={category.id}
                onPress={() => setActiveCategoryId(category.id)}
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

        <View className="mt-6 px-6">
          <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Nổi bật tuần này
          </Text>

          <Pressable
            style={styles.featureCard}
            className="overflow-hidden rounded-[32px] p-2.5"
          >
            <View className="relative h-48 overflow-hidden rounded-[24px]">
              <Image
                source={{ uri: data.featuredCourse.imageUrl }}
                className="h-full w-full"
                resizeMode="cover"
              />

              <View className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/60 px-3 py-1">
                <Text className="text-[10px] font-bold text-white">
                  {data.featuredCourse.tagLabel}
                </Text>
              </View>

              <View className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5">
                <Text className="text-xs font-bold text-slate-900">
                  {data.featuredCourse.priceLabel}
                </Text>
              </View>
            </View>

            <View className="p-3">
              <Text className="mb-1 text-xl font-extrabold text-slate-800">
                {data.featuredCourse.title}
              </Text>
              <Text
                className="mb-3 text-xs font-medium text-slate-500"
                numberOfLines={2}
              >
                {data.featuredCourse.description}
              </Text>

              <View className="flex-row items-center justify-between border-t border-slate-200/60 pt-3">
                <View className="flex-row items-center gap-2">
                  <Image
                    source={{
                      uri: "https://ui-avatars.com/api/?name=Alex+Design&background=random",
                    }}
                    className="h-6 w-6 rounded-full"
                  />
                  <Text className="text-xs font-bold text-slate-600">
                    {data.featuredCourse.instructorName}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text className="text-xs font-bold text-amber-500">
                    {data.featuredCourse.rating}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        <View className="mt-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-slate-800">
              Mới nhất
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-bold text-violet-600">Sắp xếp</Text>
              <Ionicons name="chevron-down" size={12} color="#7c3aed" />
            </View>
          </View>

          {filteredCourses.map((item) => (
            <CourseItemCard item={item} key={item.id} />
          ))}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  bgBlobA: {
    position: "absolute",
    top: -80,
    left: -90,
    width: 300,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(191,219,254,0.45)",
  },
  bgBlobB: {
    position: "absolute",
    top: 120,
    right: -120,
    width: 300,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(221,214,254,0.45)",
  },
  bgBlobC: {
    position: "absolute",
    bottom: 10,
    left: -40,
    width: 270,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(245,208,254,0.4)",
  },
  searchShell: {
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#334155",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },
  chipBase: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  chipActive: {
    backgroundColor: "#a78bfa",
    borderColor: "transparent",
  },
  chipInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  featureCard: {
    backgroundColor: "rgba(255,255,255,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    shadowColor: "#1f2687",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  courseItemCard: {
    backgroundColor: "rgba(255,255,255,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
});
