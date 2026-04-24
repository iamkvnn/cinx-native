import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useMemo, useState, type ReactElement } from "react";
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
import type {
  CartItemResponse,
  CourseDetailResponse,
  LessonResponse,
  OrderDetailResponse,
  ReviewResponse,
} from "@/types";

import CourseAboutTab from "../../components/course/CourseAboutTab";
import CourseCurriculumTab from "../../components/course/CourseCurriculumTab";
import CourseReviewsTab from "../../components/course/CourseReviewsTab";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import { CartControllerService } from "../../services/api/CartControllerService";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { EnrollmentControllerService } from "../../services/api/EnrollmentControllerService";
import { OrderControllerService } from "../../services/api/OrderControllerService";
import { checkoutOrder } from "../../services/api/orderApi";
import { ReviewControllerService } from "../../services/api/ReviewControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import { useAuthStore } from "../../store/useAuthStore";
import { extractCompletedLessonIds } from "../../utils/lessonFlow";
import {
  formatPriceK as formatPriceKShared,
  resolvePricing,
} from "../../utils/pricing";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type CourseDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CourseDetail"
>;

type CourseTab = "about" | "curriculum" | "reviews";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&q=80";

type PurchasedCourse = {
  courseId: string;
  progressPercentage: number;
};

const mapOrderStatus = (order: OrderDetailResponse): string => {
  const paymentStatus = String(order.payment?.status ?? "").toUpperCase();

  if (paymentStatus === "PAID") {
    return "COMPLETED";
  }

  if (paymentStatus === "REFUNDED") {
    return "CANCELLED";
  }

  return "PENDING";
};

const fetchCourseById = async (
  courseId: string | number,
): Promise<CourseDetailResponse> => {
  const response = await CourseControllerService.getCourseById({
    id: String(courseId),
  });

  if (!response.data) {
    throw new Error("Không tìm thấy khóa học.");
  }

  return response.data;
};

const fetchCourseReviews = async (
  courseId: string | number,
): Promise<Array<ReviewResponse & { createdAt?: string }>> => {
  const response = await ReviewControllerService.getReviewsByCourseId({
    courseId: String(courseId),
  });

  return (response.data ?? []).map((review) => ({
    ...review,
    createdAt: new Date().toISOString(),
  }));
};

const fetchPurchasedCourses = async (): Promise<PurchasedCourse[]> => {
  const enrolledResponse = await EnrollmentControllerService.getEnrolledCourses(
    {
      page: 1,
      size: 100,
    },
  );
  const courses = enrolledResponse.data ?? [];

  if (courses.length === 0) {
    return [];
  }

  const progressResponse =
    await LearningProgressControllerService.getCourseProgressByCourseIds({
      courseIds: courses
        .map((course) => String(course.id ?? ""))
        .filter(Boolean),
    });

  const progressMap = new Map<string, number>(
    (progressResponse.data ?? []).map((progress) => {
      const completedItems = Number(progress.completedItems ?? 0);
      const totalItems = Number(progress.totalItems ?? 0);
      const progressPercentage =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return [String(progress.courseId ?? ""), progressPercentage];
    }),
  );

  return courses.map((course) => {
    const mappedCourseId = String(course.id ?? "");

    return {
      courseId: mappedCourseId,
      progressPercentage: progressMap.get(mappedCourseId) ?? 0,
    };
  });
};

const fetchMyOrders = async (): Promise<OrderDetailResponse[]> => {
  const response = await OrderControllerService.getOrders({
    page: 1,
    size: 50,
  });

  return response.data ?? [];
};

const fetchCart = async (): Promise<CartItemResponse[]> => {
  const response = await CartControllerService.getCart();
  return response.data ?? [];
};

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

const readCategoryLabel = (category: unknown): string => {
  if (typeof category === "string" && category.trim().length > 0) {
    return category;
  }

  if (
    category &&
    typeof category === "object" &&
    "name" in category &&
    typeof (category as { name?: unknown }).name === "string"
  ) {
    const name = String((category as { name?: string }).name ?? "").trim();
    if (name.length > 0) {
      return name;
    }
  }

  return "Design";
};

export default function CourseDetailScreen({
  route,
  navigation,
}: CourseDetailScreenProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const scrollY = useState(new Animated.Value(0))[0];
  const requestedInitialTab = route.params?.initialTab;
  const [activeTab, setActiveTab] = useState<CourseTab>(
    requestedInitialTab ?? "about",
  );
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const courseId = String(route.params?.courseId ?? "").trim();
  const hasValidCourseId = courseId.length > 0;

  useEffect(() => {
    if (requestedInitialTab) {
      setActiveTab(requestedInitialTab);
    }
  }, [requestedInitialTab]);

  const courseQuery = useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: () => fetchCourseById(courseId),
    enabled: hasValidCourseId,
  });

  const reviewsQuery = useQuery({
    queryKey: ["course-detail", "reviews", courseId],
    queryFn: () => fetchCourseReviews(courseId),
    enabled: hasValidCourseId,
  });

  const purchasedCoursesQuery = useQuery({
    queryKey: ["course-detail", "purchased-courses", user?.id],
    queryFn: fetchPurchasedCourses,
    enabled: Boolean(user),
  });

  const itemProgressQuery = useQuery({
    queryKey: ["course-detail", "item-progress", courseId],
    queryFn: () =>
      LearningProgressControllerService.getLearningItemProgressByCourseId({
        courseId,
      }),
    enabled: hasValidCourseId && Boolean(user),
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "my-orders"],
    queryFn: fetchMyOrders,
    enabled: Boolean(user),
    retry: false,
  });

  const cartQuery = useQuery({
    queryKey: ["cart", "list"],
    queryFn: fetchCart,
    enabled: Boolean(user),
    retry: false,
  });

  const course = courseQuery.data;
  const courseTitle = course?.title ?? "Chi tiết khóa học";
  const completedLessonIds = useMemo(() => {
    return extractCompletedLessonIds(itemProgressQuery.data?.data);
  }, [itemProgressQuery.data?.data]);

  const imageUrl = course?.images?.[0]?.imageUrl ?? FALLBACK_IMAGE;

  const instructorName = course?.instructor?.name ?? "Giảng viên";

  const ratingLabel =
    typeof course?.rating === "number" && Number.isFinite(course.rating)
      ? course.rating.toFixed(1)
      : "Chưa có";
  const ratingCountLabel = reviewsQuery.data?.length
    ? `${reviewsQuery.data.length} đánh giá`
    : "0 đánh giá";
  const learnersLabel = `${
    Number(course?.enrollmentCount ?? 0).toLocaleString("vi-VN") || "0"
  } học viên`;

  const coursePricing = resolvePricing(course?.price, course?.discountedPrice);
  const salePrice = formatPriceKShared(coursePricing.currentPrice);
  const categoryLabel = readCategoryLabel(course?.category);
  const oldPrice = coursePricing.hasDiscount
    ? formatPriceKShared(coursePricing.originalPrice)
    : null;

  const isPurchased = useMemo(() => {
    if (!user) {
      return false;
    }

    const purchased = purchasedCoursesQuery.data ?? [];

    return purchased.some((item) => {
      return String(item.courseId) === courseId;
    });
  }, [courseId, purchasedCoursesQuery.data, user]);

  const progressPercent = useMemo(() => {
    if (!isPurchased) {
      return 0;
    }

    const purchased = purchasedCoursesQuery.data ?? [];
    const target = purchased.find((item) => {
      return String(item.courseId) === courseId;
    });

    return Math.max(0, Math.min(100, Number(target?.progressPercentage ?? 0)));
  }, [courseId, isPurchased, purchasedCoursesQuery.data]);

  const isInCart = useMemo(() => {
    const source = cartQuery.data;
    let cartItems: CartItemResponse[] = [];

    if (Array.isArray(source)) {
      cartItems = source;
    } else if (
      source &&
      typeof source === "object" &&
      "items" in source &&
      Array.isArray((source as { items?: unknown }).items)
    ) {
      cartItems = (
        (source as { items?: CartItemResponse[] }).items ?? []
      ).filter(Boolean);
    }

    return cartItems.some((item) => {
      const itemCourseId = String(item.course?.id ?? "");
      return itemCourseId === courseId;
    });
  }, [cartQuery.data, courseId]);

  const sections = useMemo(() => {
    const source = course?.sections ?? [];

    return [...source]
      .sort((a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0))
      .map((section) => ({
        ...section,
        lessons: [...(section.lessons ?? [])].sort(
          (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
        ),
      }));
  }, [course?.sections]);

  const orderedLessons = useMemo(() => {
    return sections.flatMap((section) => section.lessons ?? []);
  }, [sections]);

  const currentLearningLesson = useMemo(() => {
    const firstIncompleteLesson = orderedLessons.find((lesson) => {
      const lessonId = String(lesson.id ?? "").trim();
      return lessonId.length > 0 && !completedLessonIds.includes(lessonId);
    });

    return firstIncompleteLesson ?? orderedLessons[0] ?? null;
  }, [completedLessonIds, orderedLessons]);

  const pendingOrder = useMemo(() => {
    return (ordersQuery.data ?? []).find(
      (order) => mapOrderStatus(order) === "PENDING",
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

    if (!hasValidCourseId) {
      showToast("Không tìm thấy khóa học hợp lệ.");
      return;
    }

    if (isInCart) {
      showToast("Khóa học đã có trong giỏ hàng.");
      return;
    }

    try {
      setIsAddingToCart(true);
      await CartControllerService.addToCart({
        requestBody: { courseId: String(courseId) },
      });
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

    if (!hasValidCourseId) {
      showToast("Không tìm thấy khóa học hợp lệ.");
      return;
    }

    if (isAddingToCart || isBuyingNow) {
      return;
    }

    navigation.navigate("Checkout", { courseId: String(courseId) });
  };

  const handleOpenCurrentLesson = (): void => {
    if (!isPurchased) {
      showToast("Bạn cần sở hữu khóa học để bắt đầu học.");
      return;
    }

    if (!currentLearningLesson) {
      showToast("Khóa học chưa có bài học để tiếp tục.");
      return;
    }

    handlePressLesson(currentLearningLesson);
  };

  const handleContinueLearning = (): void => {
    handleOpenCurrentLesson();
  };

  const handlePressLesson = (lesson: LessonResponse): void => {
    const rawLesson = lesson as LessonResponse & {
      lessonId?: string;
      type?: string;
    };
    const lessonId = String(rawLesson.id ?? rawLesson.lessonId ?? "").trim();

    if (!lessonId) {
      showToast("Không lấy được thông tin bài học.");
      return;
    }

    const lessonType = String(
      rawLesson.lessonType ?? rawLesson.type ?? "",
    ).toUpperCase();
    const lessonTitle = lesson.title ?? "Bài học";

    if (lessonType.includes("VIDEO")) {
      navigation.navigate("VideoLesson", {
        lessonId,
        courseId,
        lessonTitle,
      });
      return;
    }

    if (lessonType.includes("ARTICLE") || lessonType.includes("CONTENT")) {
      navigation.navigate("ArticleLesson", {
        lessonId,
        courseId,
        lessonTitle,
      });
      return;
    }

    if (lessonType.includes("QUIZ")) {
      navigation.navigate("QuizLesson", {
        lessonId,
        courseId,
        lessonTitle,
      });
      return;
    }

    if (lessonType.includes("ASSIGNMENT")) {
      navigation.navigate("AssignmentLesson", {
        lessonId,
        courseId,
        lessonTitle,
      });
      return;
    }

    showToast("Loại bài học này sẽ được hỗ trợ ở bước tiếp theo.");
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
          <Pressable
            className="mb-6 mt-1 overflow-hidden rounded-[32px]"
            onPress={handleOpenCurrentLesson}
          >
            <Image
              source={{ uri: imageUrl }}
              className="h-[210px] w-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-slate-900/35" />
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
          </Pressable>

          <View className="mb-3 flex-row items-center gap-2">
            <Text className="rounded-md bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-600">
              {categoryLabel}
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
                    course.instructor?.profilePictureUrl ??
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

          <View className="mt-2 flex-row overflow-hidden rounded-[20px] bg-slate-900/5 p-1">
            {[
              { key: "about" as const, label: "Tổng quan" },
              { key: "curriculum" as const, label: "Nội dung" },
              { key: "reviews" as const, label: "Đánh giá" },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                className={`z-10 flex-1 items-center justify-center rounded-2xl py-3 ${
                  activeTab === tab.key ? "bg-white" : "bg-transparent"
                }`}
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
              duration={course.duration}
            />
          ) : null}

          {activeTab === "curriculum" ? (
            <CourseCurriculumTab
              sections={sections}
              isPurchased={isPurchased}
              openSections={openSections}
              completedLessonIds={completedLessonIds}
              onToggleSection={handleToggleSection}
              onPressLesson={handlePressLesson}
            />
          ) : null}

          {activeTab === "reviews" ? (
            <CourseReviewsTab
              courseId={String(courseId)}
              isPurchased={isPurchased}
              reviews={reviewsQuery.data ?? []}
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
                disabled={isAddingToCart || isBuyingNow || isInCart}
                style={isInCart ? { opacity: 0.45 } : undefined}
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
