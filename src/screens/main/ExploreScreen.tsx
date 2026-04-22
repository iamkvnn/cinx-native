import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ExploreCategoryList from "../../components/explore/ExploreCategoryList";
import CourseCard from "../../components/domain/course/CourseCard";
import ExploreFilterButton from "../../components/explore/ExploreFilterButton";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import { fetchCart } from "../../services/api/cartApi";
import SearchBar from "../../components/ui/inputs/SearchBar";
import {
  fetchCategories,
  fetchCourses,
  fetchFeaturedCourse,
  type ExploreCourseApi,
  type ExploreCoursesPageApi,
} from "../../services/api/exploreApi";
import type {
  ExploreCategory,
  ExploreCourseItem,
  ExploreFeaturedCourse,
} from "../../types/explore";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../store/useAuthStore";
import { formatPriceK, resolvePricing } from "../../utils/pricing";

const FALLBACK_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

type SortOption =
  | "best_seller"
  | "newest"
  | "top_rated"
  | "price_asc"
  | "price_desc";

type ExploreFilters = {
  priceType: "all" | "free" | "paid";
  isDiscounted: boolean;
  categoryId: string;
};

const DEFAULT_FILTERS: ExploreFilters = {
  priceType: "all",
  isDiscounted: false,
  categoryId: "",
};

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "best_seller", label: "Bán chạy nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "top_rated", label: "Đánh giá cao nhất" },
  { value: "price_asc", label: "Giá: Thấp đến cao" },
  { value: "price_desc", label: "Giá: Cao đến thấp" },
];

const SORT_LABELS: Record<SortOption, string> = {
  best_seller: "Bán chạy nhất",
  newest: "Mới nhất",
  top_rated: "Đánh giá cao",
  price_asc: "Giá: Thấp đến cao",
  price_desc: "Giá: Cao đến thấp",
};

const formatLearners = (value: number | undefined): string => {
  const count = Number(value ?? 0);

  if (!Number.isFinite(count) || count <= 0) {
    return "0 học viên";
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k học viên`;
  }

  return `${count} học viên`;
};

const mapCourseItem = (item: ExploreCourseApi): ExploreCourseItem => {
  const pricing = resolvePricing(
    item.price,
    (item as { discountedPrice?: number; discounted_price?: number })
      .discountedPrice ??
      (item as { discounted_price?: number }).discounted_price,
  );
  const resolvedCategory =
    typeof item.category === "string"
      ? { id: "", name: item.category }
      : item.category;
  const instructorName =
    item.instructor?.fullName ??
    item.instructor?.name ??
    item.instructor?.profile?.fullName ??
    "Giảng viên";

  return {
    id: String(item.id),
    title: item.title ?? "Khóa học",
    subtitle: instructorName,
    categoryId: String(resolvedCategory?.id ?? ""),
    categoryLabel: resolvedCategory?.name ?? "Tổng hợp",
    durationLabel: "10 giờ",
    rating: 4.8,
    learnersLabel: formatLearners(
      item.enrollmentCount ?? item.enrollment_count,
    ),
    priceLabel: formatPriceK(pricing.currentPrice),
    oldPriceLabel: pricing.hasDiscount
      ? formatPriceK(pricing.originalPrice)
      : undefined,
    imageUrl: item.thumbnailUrl ?? item.thumbnail_url ?? FALLBACK_COURSE_IMAGE,
  };
};

const mapFeaturedCourse = (
  item: ExploreCourseApi | null,
): ExploreFeaturedCourse => {
  const mapped = item ? mapCourseItem(item) : null;

  return {
    id: mapped?.id ?? "featured-empty",
    title: mapped?.title ?? "Chưa có khóa học nổi bật",
    description: mapped?.subtitle ?? "Dữ liệu sẽ được cập nhật sớm.",
    instructorName: mapped?.subtitle ?? "Đội ngũ Cinx",
    rating: 4.8,
    learnersLabel: mapped?.learnersLabel ?? "0 học viên",
    priceLabel: mapped?.priceLabel ?? "Miễn phí",
    oldPriceLabel: mapped?.oldPriceLabel,
    tagLabel: mapped?.categoryLabel ?? "Mới",
    imageUrl: mapped?.imageUrl ?? FALLBACK_COURSE_IMAGE,
  };
};

export default function ExploreScreen(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<ExploreFilters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] =
    useState<ExploreFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedKeyword(searchKeyword.trim());
    }, 800);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchKeyword]);

  const categoriesQuery = useQuery({
    queryKey: ["explore", "categories"],
    queryFn: fetchCategories,
  });

  const featuredQuery = useQuery({
    queryKey: ["explore", "featured"],
    queryFn: fetchFeaturedCourse,
  });

  const cartQuery = useQuery({
    queryKey: ["cart", "badge"],
    queryFn: fetchCart,
    enabled: isAuthenticated,
    retry: false,
  });

  const coursesQuery = useInfiniteQuery<ExploreCoursesPageApi>({
    queryKey: [
      "explore",
      "courses",
      debouncedKeyword,
      sortOption,
      appliedFilters.categoryId,
      appliedFilters.priceType,
      appliedFilters.isDiscounted,
    ],
    placeholderData: (previousData) => previousData,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCourses({
        pageParam: Number(pageParam),
        categoryId: appliedFilters.categoryId,
        keyword: debouncedKeyword,
        sortBy: sortOption,
        priceType: appliedFilters.priceType,
        isDiscounted: appliedFilters.isDiscounted,
      }),
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage?.page ?? 1);
      const totalPages = Number(lastPage?.totalPages ?? currentPage);

      if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages)) {
        return undefined;
      }

      if (currentPage >= totalPages) {
        return undefined;
      }

      return currentPage + 1;
    },
  });

  const categories = useMemo<ExploreCategory[]>(() => {
    const fromApi = (categoriesQuery.data ?? []).map((category) => ({
      id: String(category.id),
      name: category.name ?? "Danh mục",
    }));

    return [{ id: "", name: "Tất cả" }, ...fromApi];
  }, [categoriesQuery.data]);

  const featuredCourse = useMemo(() => {
    return mapFeaturedCourse(featuredQuery.data ?? null);
  }, [featuredQuery.data]);

  const flattenedCourses = useMemo<ExploreCourseItem[]>(() => {
    const pages = coursesQuery.data?.pages ?? [];
    return pages.flatMap((page) => {
      const items = Array.isArray(page?.data) ? page.data : [];
      return items.map(mapCourseItem);
    });
  }, [coursesQuery.data]);

  const cartItemsCount = useMemo<number>(() => {
    if (!isAuthenticated) {
      return 0;
    }

    const items = cartQuery.data?.items ?? [];

    return items.reduce((total, item) => {
      const quantity = Number(item.quantity ?? 1);
      return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
    }, 0);
  }, [cartQuery.data, isAuthenticated]);

  const stickyOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const isLoadingInitialData =
    categoriesQuery.isLoading || featuredQuery.isLoading;
  const hasCourseData = flattenedCourses.length > 0;
  const isFilteringFetch =
    coursesQuery.isFetching &&
    !coursesQuery.isFetchingNextPage &&
    !coursesQuery.isLoading;
  const hasInitialError =
    categoriesQuery.isError ||
    featuredQuery.isError ||
    (coursesQuery.isError && !hasCourseData);
  const activeCategoryId = appliedFilters.categoryId;
  const activeCategoryName =
    categories.find((category) => category.id === activeCategoryId)?.name ??
    "Mới nhất";
  const currentSortLabel = sortOption ? SORT_LABELS[sortOption] : "Sắp xếp";

  const handleLoadMore = (): void => {
    if (
      coursesQuery.hasNextPage &&
      !coursesQuery.isFetchingNextPage &&
      !coursesQuery.isFetching
    ) {
      void coursesQuery.fetchNextPage();
    }
  };

  const handleApplyFilters = (): void => {
    setAppliedFilters(tempFilters);
    setIsFilterVisible(false);
  };

  const handleResetTempFilters = (): void => {
    setTempFilters(DEFAULT_FILTERS);
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        categoriesQuery.refetch(),
        featuredQuery.refetch(),
        coursesQuery.refetch(),
        isAuthenticated ? cartQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const listHeader = useMemo(() => {
    return (
      <>
        <View className="px-6 pb-2 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-4xl font-black tracking-tight text-slate-800">
              Khám phá
            </Text>
          </View>
          <Text className="mb-1 text-sm tracking-wider text-slate-500">
            Tìm kiếm mọi kiến thức
          </Text>
        </View>

        <View className="px-6 py-3">
          <View className="relative z-10 flex-row items-center gap-3">
            <SearchBar
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              onSubmitEditing={() => setDebouncedKeyword(searchKeyword.trim())}
              placeholder="Tìm khóa học, tác giả..."
            />

            <ExploreFilterButton
              onPress={() => {
                setTempFilters(appliedFilters);
                setIsFilterVisible(true);
              }}
            />
          </View>
        </View>

        <ExploreCategoryList
          categories={categories}
          activeCategoryId={appliedFilters.categoryId}
          onSelectCategory={(id) => {
            setAppliedFilters((previous) => ({
              ...previous,
              categoryId: id,
            }));
            setTempFilters((previous) => ({
              ...previous,
              categoryId: id,
            }));
          }}
        />

        {debouncedKeyword === "" && appliedFilters.categoryId === "" ? (
          <View className="mt-6 px-6">
            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Nổi bật tuần này
            </Text>

            <Pressable
              style={styles.featureCard}
              className="overflow-hidden rounded-[32px] p-2.5"
              onPress={() =>
                navigation.navigate("CourseDetail", {
                  courseId: featuredCourse.id,
                })
              }
            >
              <View className="relative h-48 overflow-hidden rounded-[24px]">
                <Image
                  source={{ uri: featuredCourse.imageUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />

                <View className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/60 px-3 py-1">
                  <Text className="text-[10px] font-bold text-white">
                    {featuredCourse.tagLabel}
                  </Text>
                </View>

                <View className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5">
                  {featuredCourse.oldPriceLabel ? (
                    <Text className="text-[10px] font-semibold text-slate-500 line-through">
                      {featuredCourse.oldPriceLabel}
                    </Text>
                  ) : null}
                  <Text className="text-xs font-bold text-slate-900">
                    {featuredCourse.priceLabel}
                  </Text>
                </View>
              </View>

              <View className="p-3">
                <Text className="mb-1 text-xl font-extrabold text-slate-800">
                  {featuredCourse.title}
                </Text>
                <Text
                  className="mb-3 text-xs font-medium text-slate-500"
                  numberOfLines={2}
                >
                  {featuredCourse.description}
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
                      {featuredCourse.instructorName}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text className="text-xs font-bold text-amber-500">
                        {featuredCourse.rating}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="people" size={12} color="#94a3b8" />
                      <Text
                        className="text-xs font-bold text-slate-500"
                        numberOfLines={1}
                      >
                        {featuredCourse.learnersLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        ) : null}

        <View className="mt-8 px-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text
              className="text-lg font-extrabold text-slate-800"
              numberOfLines={1}
            >
              {activeCategoryId === "" ? "Mới nhất" : activeCategoryName}
            </Text>
            <Pressable
              className="max-w-[55%] flex-row items-center justify-end gap-1"
              onPress={() => setIsSortVisible(true)}
            >
              <Text
                className="text-xs font-bold text-violet-600"
                numberOfLines={1}
              >
                {currentSortLabel}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#7c3aed" />
            </Pressable>
          </View>
          {isFilteringFetch ? (
            <View className="mb-3 self-start rounded-full bg-white/70 px-3 py-2">
              <ActivityIndicator size="small" color="#8b5cf6" />
            </View>
          ) : null}
        </View>
      </>
    );
  }, [
    appliedFilters.categoryId,
    cartItemsCount,
    categories,
    debouncedKeyword,
    featuredCourse,
    isFilteringFetch,
    navigation,
    searchKeyword,
    stickyOpacity,
    activeCategoryId,
    activeCategoryName,
    currentSortLabel,
  ]);

  if (isLoadingInitialData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-3 text-sm font-semibold text-slate-500">
          Đang tải khám phá...
        </Text>
      </SafeAreaView>
    );
  }

  if (hasInitialError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-6">
        <AppScreenBackground />
        <Text className="text-base font-semibold text-red-500">
          Không thể tải dữ liệu Explore.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />
      <Animated.FlatList
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor="#8b5cf6"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, paddingHorizontal: 24 }}
        data={flattenedCourses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourseCard
            variant="explore"
            title={item.title}
            instructor={item.subtitle}
            rating={item.rating}
            learnersLabel={item.learnersLabel}
            priceLabel={item.priceLabel}
            oldPriceLabel={item.oldPriceLabel}
            imageUrl={item.imageUrl}
            categoryLabel={item.categoryLabel}
            onPress={() =>
              navigation.navigate("CourseDetail", {
                courseId: item.id,
              })
            }
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="px-6">
            <View style={styles.emptyCourseCard} className="rounded-[28px] p-4">
              <Text className="text-sm font-semibold leading-6 text-slate-600">
                Không có khóa học phù hợp với bộ lọc hiện tại.
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View className="items-center py-4">
            {coursesQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : null}
            {coursesQuery.isFetchNextPageError ? (
              <Text className="text-xs font-semibold text-slate-500">
                Tải thêm thất bại. Cuộn xuống để thử lại.
              </Text>
            ) : null}
            {!isFilteringFetch &&
            !coursesQuery.isFetchingNextPage &&
            !coursesQuery.isFetchNextPageError ? (
              <View className="h-6" />
            ) : null}
          </View>
        }
      />

      <Modal
        transparent
        visible={isSortVisible}
        animationType="fade"
        onRequestClose={() => setIsSortVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-end bg-black/40 px-5 pb-8"
          onPress={() => setIsSortVisible(false)}
        >
          <Pressable
            style={styles.featureCard}
            className="w-full overflow-hidden rounded-[28px] p-4"
            onPress={() => undefined}
          >
            <BlurView intensity={24} tint="light" style={styles.blurFill} />
            <Text className="mb-3 text-base font-extrabold text-slate-800">
              Sắp xếp theo
            </Text>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortOption === option.value;

              return (
                <Pressable
                  key={option.value}
                  className={`mb-2 flex-row items-center justify-between rounded-2xl px-3 py-3 ${isActive ? "bg-violet-100" : "bg-white/70"}`}
                  onPress={() => {
                    setSortOption(option.value);
                    setIsSortVisible(false);
                  }}
                >
                  <Text
                    className={`text-sm font-bold ${isActive ? "text-violet-700" : "text-slate-700"}`}
                  >
                    {option.label}
                  </Text>
                  {isActive ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#7c3aed"
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={isFilterVisible}
        animationType="fade"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View className="flex-1 bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => setIsFilterVisible(false)}
          />

          <View className="absolute right-0 top-0 bottom-0 w-[80%] overflow-hidden bg-white/95">
            <BlurView intensity={24} tint="light" style={styles.blurFill} />

            <View className="px-5 pb-3 pt-14">
              <Text className="text-xl font-black text-slate-800">
                Lọc khóa học
              </Text>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-5 pb-28"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-6">
                <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Giá bán
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(
                    [
                      { value: "all", label: "Tất cả" },
                      { value: "free", label: "Miễn phí" },
                      { value: "paid", label: "Tính phí" },
                    ] as const
                  ).map((option) => {
                    const isActive = tempFilters.priceType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() =>
                          setTempFilters((previous) => ({
                            ...previous,
                            priceType: option.value,
                          }))
                        }
                        className={`rounded-full px-4 py-2 ${isActive ? "bg-violet-500" : "bg-white/80"}`}
                      >
                        <Text
                          className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-700"}`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="mb-6">
                <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Khuyến mãi
                </Text>
                <Pressable
                  className="flex-row items-center justify-between rounded-2xl bg-white/80 px-4 py-3"
                  onPress={() =>
                    setTempFilters((previous) => ({
                      ...previous,
                      isDiscounted: !previous.isDiscounted,
                    }))
                  }
                >
                  <Text className="text-sm font-bold text-slate-700">
                    Đang khuyến mãi
                  </Text>
                  <Ionicons
                    name={
                      tempFilters.isDiscounted ? "checkbox" : "square-outline"
                    }
                    size={20}
                    color={tempFilters.isDiscounted ? "#7c3aed" : "#94a3b8"}
                  />
                </Pressable>
              </View>

              <View>
                <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Danh mục
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((category) => {
                    const isActive = tempFilters.categoryId === category.id;
                    return (
                      <Pressable
                        key={`drawer-${category.id}`}
                        onPress={() =>
                          setTempFilters((previous) => ({
                            ...previous,
                            categoryId: category.id,
                          }))
                        }
                        className={`rounded-full px-4 py-2 ${isActive ? "bg-violet-500" : "bg-white/80"}`}
                      >
                        <Text
                          className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-700"}`}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 border-t border-white/60 bg-white/90 px-5 py-4">
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 items-center justify-center rounded-2xl bg-slate-200 py-3"
                  onPress={handleResetTempFilters}
                >
                  <Text className="text-sm font-bold text-slate-700">
                    Xóa lọc
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center justify-center rounded-2xl bg-violet-500 py-3"
                  onPress={handleApplyFilters}
                >
                  <Text className="text-sm font-bold text-white">Xác nhận</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  featureCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
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
  emptyCourseCard: {
    backgroundColor: "rgba(255,255,255,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
});
