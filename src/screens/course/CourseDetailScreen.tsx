import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CourseAboutTab from "../../components/course/CourseAboutTab";
import CourseCurriculumTab from "../../components/course/CourseCurriculumTab";
import CourseReviewsTab from "../../components/course/CourseReviewsTab";
import AppScreenBackground from "../../components/ui/AppScreenBackground";
import {
  addCourseToCart,
  fetchCourseById,
  fetchCourseReviews,
  type CourseDetailApi,
} from "../../services/api/courseApi";
import { fetchMyCourses } from "../../services/api/myLearningApi";
import { checkoutOrder, fetchMyOrders } from "../../services/api/orderApi";
import { useAuthStore } from "../../store/useAuthStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type CourseDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CourseDetail"
>;

type CourseTab = "about" | "curriculum" | "reviews";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&q=80";

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    return message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const showToast = (message: string): void => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert("Thông báo", message);
};

const formatPriceK = (value: number | undefined): string => {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Miễn phí";
  }

  const thousands = numeric / 1000;

  if (Number.isInteger(thousands)) {
    return `${Math.round(thousands).toLocaleString("vi-VN")}k`;
  }

  return `${Number(thousands.toFixed(1)).toLocaleString("vi-VN")}k`;
};

export default function CourseDetailScreen({
  route,
  navigation,
}: CourseDetailScreenProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const scrollY = useState(new Animated.Value(0))[0];
  const [activeTab, setActiveTab] = useState<CourseTab>("about");
  const [expandDescription, setExpandDescription] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const courseId = Number(route.params?.courseId ?? 0);

  const courseQuery = useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: () => fetchCourseById(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
  });

  const reviewsQuery = useQuery({
    queryKey: ["course-detail", "reviews", courseId],
    queryFn: () => fetchCourseReviews(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
  });

  const purchasedCoursesQuery = useQuery({
    queryKey: ["course-detail", "purchased-courses", user?.id],
    queryFn: fetchMyCourses,
    enabled: Boolean(user),
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "my-orders"],
    queryFn: fetchMyOrders,
    enabled: Boolean(user),
    retry: false,
  });

  const course = courseQuery.data;
  const courseTitle = course?.title ?? "Chi tiết khóa học";

  const tabIndex = useMemo(() => {
    if (activeTab === "about") return 0;
    if (activeTab === "curriculum") return 1;
    return 2;
  }, [activeTab]);

  const imageUrl =
    course?.thumbnailUrl ?? course?.thumbnail_url ?? FALLBACK_IMAGE;

  const instructorName =
    course?.instructor?.profile?.fullName ??
    course?.instructor?.fullName ??
    "Giảng viên";

  const ratingLabel = "4.9";
  const ratingCountLabel = "12.5k đánh giá";
  const learnersLabel = `${
    Number(
      course?.enrollmentCount ?? course?.enrollment_count ?? 0,
    ).toLocaleString("vi-VN") || "0"
  } học viên`;

  const salePrice = formatPriceK(course?.price);
  const oldPrice =
    course?.discountPercent && course.discountPercent > 0 && course.price
      ? formatPriceK(
          Math.round(
            course.price / (1 - Math.min(90, course.discountPercent) / 100),
          ),
        )
      : null;

  const isPurchased = useMemo(() => {
    if (!user) {
      return false;
    }

    const purchased = purchasedCoursesQuery.data ?? [];

    return purchased.some((item) => {
      const purchasedId = Number(item.course?.id ?? item.courseId);
      return purchasedId === courseId;
    });
  }, [courseId, purchasedCoursesQuery.data, user]);

  const progressPercent = useMemo(() => {
    if (!isPurchased) {
      return 0;
    }

    const purchased = purchasedCoursesQuery.data ?? [];
    const target = purchased.find((item) => {
      const purchasedId = Number(item.course?.id ?? item.courseId);
      return purchasedId === courseId;
    });

    return Math.max(0, Math.min(100, Number(target?.progressPercentage ?? 0)));
  }, [courseId, isPurchased, purchasedCoursesQuery.data]);

  const sections = course?.sections ?? [];

  const pendingOrder = useMemo(() => {
    return (ordersQuery.data ?? []).find(
      (order) => String(order.status ?? "").toUpperCase() === "PENDING",
    );
  }, [ordersQuery.data]);

  const handleToggleSection = (sectionId: string): void => {
    setOpenSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }));
  };

  const navigateToLoginWithRedirect = (): void => {
    navigation.navigate("Login", {
      redirectTo: "CourseDetail",
      courseId: String(courseId),
    });
  };

  const handleAddToCart = async (): Promise<void> => {
    if (!user) {
      navigateToLoginWithRedirect();
      return;
    }

    if (!courseId || Number.isNaN(courseId)) {
      showToast("Không tìm thấy khóa học hợp lệ.");
      return;
    }

    try {
      setIsAddingToCart(true);
      await addCourseToCart(courseId);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      showToast("Đã thêm khóa học vào giỏ hàng.");
    } catch (error) {
      showToast(getApiErrorMessage(error, "Không thể thêm vào giỏ hàng."));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (): Promise<void> => {
    if (!user) {
      navigateToLoginWithRedirect();
      return;
    }

    if (!courseId || Number.isNaN(courseId)) {
      showToast("Không tìm thấy khóa học hợp lệ.");
      return;
    }

    if (isAddingToCart || isBuyingNow) {
      return;
    }

    try {
      setIsBuyingNow(true);

      const ordersResult = await ordersQuery.refetch();
      const pendingFromRefetch = (ordersResult.data ?? []).find(
        (order) => String(order.status ?? "").toUpperCase() === "PENDING",
      );
      const pendingId = Number(pendingFromRefetch?.id ?? pendingOrder?.id ?? 0);

      if (Number.isFinite(pendingId) && pendingId > 0) {
        Alert.alert(
          "Bạn có đơn hàng chưa hoàn tất",
          "Bạn cần xử lý đơn hàng đang chờ trước khi mua khóa học mới. Bạn muốn đến trang thanh toán hay vào Giỏ hàng?",
          [
            {
              text: "Thanh toán đơn cũ",
              onPress: () => {
                navigation.navigate("Checkout", { orderId: String(pendingId) });
              },
            },
            {
              text: "Vào Giỏ hàng",
              onPress: () => {
                navigation.navigate("Cart");
              },
            },
            {
              text: "Hủy",
              style: "cancel",
            },
          ],
        );
        return;
      }

      try {
        await addCourseToCart(courseId);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Không thể thêm vào giỏ hàng.",
        );
        const normalized = message.toLowerCase();
        const alreadyInCart = normalized.includes("already exists in cart");

        if (!alreadyInCart) {
          showToast(message);
          return;
        }
      }

      const response = await checkoutOrder();
      const orderId = Number(response?.id ?? 0);

      if (!Number.isFinite(orderId) || orderId <= 0) {
        showToast("Không lấy được thông tin đơn hàng.");
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", "my-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["cart", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["cart", "badge"] }),
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
      ]);

      navigation.navigate("Checkout", { orderId: String(orderId) });
    } catch (error) {
      showToast(
        getApiErrorMessage(
          error,
          "Không thể tạo thanh toán. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleContinueLearning = (): void => {
    showToast("Chuyển sang màn hình Video (Coming soon)");
  };

  if (courseQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="mt-3 text-sm font-semibold text-slate-500">
          Đang tải chi tiết khóa học...
        </Text>
      </SafeAreaView>
    );
  }

  if (courseQuery.isError || !course) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-6">
        <AppScreenBackground />
        <Text className="text-base font-semibold text-red-500 text-center">
          Không thể tải chi tiết khóa học.
        </Text>
        <Pressable
          className="mt-4 rounded-full bg-violet-600 px-5 py-2"
          onPress={() => void courseQuery.refetch()}
        >
          <Text className="text-sm font-bold text-white">Thử lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />

      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 148 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View className="px-4">
          <View className="mb-6 mt-1 overflow-hidden rounded-[32px]">
            <Image
              source={{ uri: imageUrl }}
              className="h-[210px] w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-slate-900/35" />
            <View className="absolute inset-0 items-center justify-center">
              <View className="h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/30 pl-1">
                <Ionicons name="play" size={24} color="#ffffff" />
              </View>
            </View>
            {isPurchased ? (
              <View className="absolute bottom-0 left-0 right-0 bg-slate-900/50 px-4 py-3">
                <Text className="mb-2 text-xs font-bold text-white">
                  Tiến độ khóa học: {progressPercent}%
                </Text>
                <View className="h-1.5 overflow-hidden rounded-full bg-white/30">
                  <View
                    className="h-full rounded-full bg-violet-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
              </View>
            ) : null}
          </View>

          <View className="mb-3 flex-row items-center gap-2">
            <Text className="rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-600">
              Bestseller
            </Text>
            <Text className="rounded-md bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-600">
              {course.category?.name ?? "Design"}
            </Text>
          </View>

          <Text className="mb-3 text-2xl font-black leading-tight text-slate-900">
            {courseTitle}
          </Text>

          <Text className="mb-4 text-sm font-medium leading-6 text-slate-500">
            {course.description ?? "Mô tả khóa học đang được cập nhật."}
          </Text>

          <View className="mb-4 flex-row gap-3">
            <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-white/70 bg-white/65 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Ionicons name="star" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-lg font-black leading-none text-slate-800">
                  {ratingLabel}
                </Text>
                <Text className="text-[10px] font-semibold text-slate-500">
                  ({ratingCountLabel})
                </Text>
              </View>
            </View>

            <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-white/70 bg-white/65 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="people" size={18} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-base font-black leading-none text-slate-800">
                  {learnersLabel}
                </Text>
                <Text className="text-[10px] font-semibold text-slate-500">
                  Học viên
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/70 bg-white/65 p-3">
            <View className="flex-row items-center gap-3">
              <Image
                source={{
                  uri:
                    course.instructor?.profile?.avatar ??
                    "https://ui-avatars.com/api/?name=Instructor&background=random",
                }}
                className="h-12 w-12 rounded-full"
              />
              <View>
                <Text className="text-xs font-semibold text-slate-500">
                  Giảng viên
                </Text>
                <Text className="text-sm font-bold text-slate-800">
                  {instructorName}
                </Text>
              </View>
            </View>

            <View className="h-9 w-9 items-center justify-center rounded-full bg-violet-50">
              <Ionicons name="chevron-forward" size={18} color="#7c3aed" />
            </View>
          </View>

          <View className="mt-2 flex-row rounded-[20px] bg-slate-900/5 p-1">
            <View
              className="absolute bottom-1 top-1 rounded-2xl bg-white"
              style={{ width: "33.333%", left: `${tabIndex * 33.333}%` }}
            />

            {[
              { key: "about" as const, label: "Tổng quan" },
              { key: "curriculum" as const, label: "Nội dung" },
              { key: "reviews" as const, label: "Đánh giá" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                className="z-10 flex-1 items-center justify-center py-3"
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  className={`text-sm font-bold ${
                    activeTab === tab.key ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "about" ? (
            <CourseAboutTab
              description={
                course.description ?? "Mô tả khóa học đang được cập nhật."
              }
              expanded={expandDescription}
              onToggleExpanded={() => setExpandDescription((value) => !value)}
            />
          ) : null}

          {activeTab === "curriculum" ? (
            <CourseCurriculumTab
              sections={sections}
              isPurchased={isPurchased}
              openSections={openSections}
              onToggleSection={handleToggleSection}
            />
          ) : null}

          {activeTab === "reviews" ? (
            <CourseReviewsTab
              courseId={String(courseId)}
              isPurchased={isPurchased}
              reviews={reviewsQuery.data?.reviews ?? []}
            />
          ) : null}
        </View>
      </Animated.ScrollView>

      <View style={styles.bottomBar}>
        <BlurView
          intensity={30}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />

        {!user ? (
          <Pressable
            className="h-12 items-center justify-center rounded-2xl bg-violet-600"
            onPress={navigateToLoginWithRedirect}
          >
            <Text className="text-sm font-bold text-white">Mua ngay</Text>
          </Pressable>
        ) : isPurchased ? (
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text className="text-xs font-bold text-slate-600">
                  Tiến độ học tập
                </Text>
                <Text className="text-xs font-bold text-violet-600">
                  {progressPercent}%
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-slate-200">
                <View
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </View>

            <Pressable
              className="h-12 w-[48%] flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900"
              onPress={handleContinueLearning}
            >
              <Text className="text-sm font-bold text-white">Tiếp tục học</Text>
              <Ionicons name="play-circle" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-3">
            <View className="pl-1">
              {oldPrice ? (
                <Text className="text-xs font-semibold text-slate-500 line-through">
                  {oldPrice}
                </Text>
              ) : null}
              <Text className="text-xl font-black text-violet-600">
                {salePrice}
              </Text>
            </View>

            <View className="flex-1 flex-row gap-2">
              <Pressable
                className="h-12 w-12 items-center justify-center rounded-2xl bg-violet-100"
                onPress={() => void handleAddToCart()}
                disabled={isAddingToCart || isBuyingNow}
              >
                {isAddingToCart ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <Ionicons name="cart-outline" size={20} color="#7c3aed" />
                )}
              </Pressable>

              <Pressable
                className="h-12 flex-1 items-center justify-center rounded-2xl bg-violet-600"
                onPress={() => void handleBuyNow()}
                disabled={isAddingToCart || isBuyingNow}
              >
                {isBuyingNow ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-sm font-bold text-white">Mua ngay</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bgBlobA: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "70%",
    height: "50%",
    borderRadius: 999,
    backgroundColor: "rgba(196,181,253,0.45)",
  },
  bgBlobB: {
    position: "absolute",
    top: "30%",
    right: "-20%",
    width: "70%",
    height: "50%",
    borderRadius: 999,
    backgroundColor: "rgba(251,207,232,0.4)",
  },
  bgBlobC: {
    position: "absolute",
    bottom: "-10%",
    left: "10%",
    width: "70%",
    height: "50%",
    borderRadius: 999,
    backgroundColor: "rgba(199,210,254,0.4)",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
  },
});
