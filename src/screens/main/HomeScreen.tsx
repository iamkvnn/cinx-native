import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import CourseCard from "../../components/domain/course/CourseCard";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";

import {
  fetchRecommendations,
  type RecommendationCourseApi,
} from "../../services/api/homeApi";
import {
  fetchDailyGoal,
  fetchMyCourses,
  fetchMyStreak,
  type MyCourseApiItem,
} from "../../services/api/myLearningApi";
import { useAuthStore } from "../../store/useAuthStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { fetchCurrentUser } from "../../services/api/authApi";

type ContinueLearningItem = {
  id: string;
  title: string;
  chapter: string;
  remainingTime: string;
  progressPercent: number;
  iconName: "book-outline" | "code-slash-outline";
  gradientColors: [string, string];
};

type RecommendationItem = {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  learners: string;
  priceLabel: string;
};

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?u=default-user";
const FALLBACK_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

const STATIC_QUOTE = {
  content:
    '"Học tập không phải hạt giống kiến thức, mà là hạt giống của hạnh phúc."',
  author: "Tuc ngu Zen",
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

const formatPriceLabel = (price: number | string | undefined): string => {
  const numeric = Number(price ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Miễn phí";
  }

  const thousands = numeric / 1000;

  if (Number.isInteger(thousands)) {
    return `${Math.round(thousands).toLocaleString("vi-VN")}k`;
  }

  return `${Number(thousands.toFixed(1)).toLocaleString("vi-VN")}k`;
};

const mapMyCourseToContinueLearning = (
  item: MyCourseApiItem,
  index: number,
): ContinueLearningItem => {
  const progress = Math.max(
    0,
    Math.min(100, Number(item.progressPercentage ?? 0)),
  );

  return {
    id: String(item.course?.id ?? item.courseId ?? index),
    title: item.course?.title ?? item.title ?? "Khoa hoc",
    chapter: "Tiếp tục bài học",
    remainingTime: `còn ${Math.max(1, Math.ceil((100 - progress) / 10) * 10)}p`,
    progressPercent: progress,
    iconName: index % 2 === 0 ? "book-outline" : "code-slash-outline",
    gradientColors:
      index % 2 === 0 ? ["#8b5cf6", "#ec4899"] : ["#60a5fa", "#22d3ee"],
  };
};

const mapRecommendationItem = (
  course: RecommendationCourseApi,
): RecommendationItem => {
  const instructorName = course.instructor?.name ?? "Giảng viên";

  const categoryLabel =
    typeof course.category === "string" && course.category.trim().length > 0
      ? course.category
      : "Tổng hợp";

  return {
    id: String(course.id),
    tag: categoryLabel,
    title: course.title ?? "Khóa học",
    description: instructorName,
    imageUrl:
      course.thumbnailUrl ?? course.thumbnail_url ?? FALLBACK_COURSE_IMAGE,
    rating: 4.8,
    learners: formatLearners(course.enrollmentCount ?? course.enrollment_count),
    priceLabel: formatPriceLabel(course.price),
  };
};

function ContinueLearningCard({
  item,
  onPress,
}: {
  item: ContinueLearningItem;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={styles.glassCard}
      className="mr-4 w-[260px] rounded-[28px] p-4"
    >
      <View className="mb-3 flex-row items-start justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/75">
          <Ionicons name={item.iconName} size={21} color="#6366f1" />
        </View>
        <Text className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-600">
          {item.remainingTime}
        </Text>
      </View>

      <Text className="mb-1 text-base font-bold text-slate-800">
        {item.title}
      </Text>
      <Text className="mb-4 text-xs text-slate-500">{item.chapter}</Text>

      <View className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            width: `${item.progressPercent}%`,
            height: 8,
            borderRadius: 999,
          }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-[10px] font-bold text-slate-400">
          {item.progressPercent}% Hoàn thành
        </Text>
        <Text className="text-[10px] font-bold text-violet-500">Tiếp tục</Text>
      </View>
    </Pressable>
  );
}

function RecommendationCard({
  item,
  onPress,
}: {
  item: RecommendationItem;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={styles.glassCard}
      className="mb-4 flex-row items-center gap-4 rounded-[28px] p-3"
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="h-20 w-20 rounded-2xl"
        resizeMode="cover"
      />

      <View className="flex-1 pr-2">
        <View className="mb-1 flex-row items-start justify-between">
          <Text className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-500">
            {item.tag}
          </Text>
          <Ionicons name="bookmark-outline" size={16} color="#94a3b8" />
        </View>

        <Text className="text-sm font-bold text-slate-800">{item.title}</Text>
        <Text className="mt-1 text-[11px] text-slate-500">
          {item.description}
        </Text>

        <View className="mt-2 flex-row items-center gap-1">
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text className="text-[10px] text-slate-400">
            {item.rating} ({item.learners})
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function GoalProgressRing({
  progress,
  achievedXp,
}: {
  progress: number;
  achievedXp: number;
}): ReactElement {
  const size = 72;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const dashOffset =
    circumference - (normalizedProgress / 100) * circumference;

  return (
    <View className="mb-2 h-[72px] w-[72px] items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#8b5cf6"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>

      <View className="absolute items-center justify-center">
        <Text className="text-sm font-bold text-slate-700">{achievedXp}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [
    myCoursesQuery,
    recommendationsQuery,
    streakQuery,
    dailyGoalQuery,
    currentUserQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: ["home", "my-courses"],
        queryFn: fetchMyCourses,
        enabled: isAuthenticated,
      },
      {
        queryKey: ["home", "recommendations"],
        queryFn: fetchRecommendations,
      },
      {
        queryKey: ["home", "streak"],
        queryFn: fetchMyStreak,
        enabled: isAuthenticated,
      },
      {
        queryKey: ["home", "daily-goal", todayDate],
        queryFn: () => fetchDailyGoal(todayDate),
        enabled: isAuthenticated,
      },
      {
        queryKey: ["home", "current-user"],
        queryFn: fetchCurrentUser,
        enabled: isAuthenticated,
      },
    ],
  });

  const continueLearningItems = useMemo(() => {
    const items = myCoursesQuery.data ?? [];
    return items.map(mapMyCourseToContinueLearning);
  }, [myCoursesQuery.data]);

  const recommendationItems = useMemo(() => {
    const items = recommendationsQuery.data ?? [];
    return items.map(mapRecommendationItem);
  }, [recommendationsQuery.data]);

  const isLoading =
    myCoursesQuery.isLoading ||
    recommendationsQuery.isLoading ||
    streakQuery.isLoading ||
    dailyGoalQuery.isLoading;
  const isError =
    myCoursesQuery.isError ||
    recommendationsQuery.isError ||
    streakQuery.isError ||
    dailyGoalQuery.isError;

  const currentStreak = Number(streakQuery.data?.currentStreak ?? 0);
  const todayGoal = dailyGoalQuery.data;
  const achievedXp = Math.max(0, Number(todayGoal?.currentXp ?? 0));
  const targetXp = Math.max(50, Number(todayGoal?.targetXp ?? 0));
  const remainingXp = Math.max(0, targetXp - achievedXp);
  const goalProgressPercent = Math.max(
    0,
    Math.min(100, Math.round((achievedXp / targetXp) * 100)),
  );

  const goalStatusLabel = todayGoal
    ? todayGoal.isCompleted
      ? "Mục tiêu hôm nay đã hoàn thành"
      : `Còn ${remainingXp} XP để hoàn thành`
    : "Chưa có goal hôm nay";

  const activeUser = currentUserQuery.data ?? user;

  const displayName =
    (activeUser?.profile as { fullName?: string } | undefined)?.fullName ??
    activeUser?.fullName ??
    "Hoc vien";
  const avatarUrl =
    (activeUser?.profile as { avatar?: string } | undefined)?.avatar ??
    activeUser?.avatar ??
    FALLBACK_AVATAR;

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        myCoursesQuery.refetch(),
        recommendationsQuery.refetch(),
        streakQuery.refetch(),
        dailyGoalQuery.refetch(),
        currentUserQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="mt-3 text-sm font-semibold text-slate-500">
          Loading
        </Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent px-6">
        <AppScreenBackground />
        <Text className="text-base font-semibold text-red-500">
          Can't load data. Please try again later.
        </Text>
        <Pressable
          className="mt-4 rounded-full bg-violet-500 px-4 py-2"
          onPress={() => {
            void myCoursesQuery.refetch();
            void recommendationsQuery.refetch();
            void streakQuery.refetch();
            void dailyGoalQuery.refetch();
            void currentUserQuery.refetch();
          }}
        >
          <Text className="text-sm font-bold text-white">Thu lai</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-28"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor="#8b5cf6"
          />
        }
      >
        <View className="mb-6 mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View>
              <Image
                source={{ uri: avatarUrl }}
                className="h-12 w-12 rounded-full border-2 border-white"
              />
              <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-400" />
            </View>

            <View>
              <Text className="text-xs font-semibold text-slate-500">
                Chào mừng trở lại,
              </Text>
              <Text className="text-xl font-bold text-slate-800">
                {displayName} 👋
              </Text>
            </View>
          </View>

          <View
            style={styles.glassCard}
            className="flex-row items-center gap-2 rounded-full px-3 py-1.5"
          >
            <Ionicons name="flame" size={14} color="#f97316" />
            <Text className="text-sm font-bold text-slate-700">
              {currentStreak} Ngày
            </Text>
          </View>
        </View>

        <View
          style={[styles.glassCard, styles.quoteCard]}
          className="mb-8 overflow-hidden rounded-[32px] p-6"
        >
          <LinearGradient
            colors={[
              "rgba(221,214,254,0.7)",
              "rgba(191,219,254,0.65)",
              "rgba(244,114,182,0.28)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.quoteContent}>
            <Ionicons name="chatbox-ellipses" size={30} color="#a78bfa" />
            <Text className="mb-3 mt-2 text-lg font-bold italic leading-7 text-slate-700">
              {STATIC_QUOTE.content}
            </Text>
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
              - {STATIC_QUOTE.author}
            </Text>
          </View>
        </View>

        <View className="mb-4 flex-row items-end justify-between">
          <Text className="text-lg font-extrabold text-slate-800">
            Đang học dở
          </Text>
          <Pressable
            onPress={() =>
              navigation.navigate("MainTabs", { screen: "MyLearning" })
            }
          >
            <Text className="text-xs font-bold text-violet-500">Tất cả</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-8"
          contentContainerClassName="pr-2"
        >
          {continueLearningItems.length === 0 ? (
            <View
              style={styles.glassCard}
              className="w-[320px] rounded-[24px] p-5"
            >
              <Text className="text-sm font-semibold leading-6 text-slate-600">
                Bạn chưa có khóa học nào. Hãy khám phá ngay nhé!
              </Text>
            </View>
          ) : (
            continueLearningItems.map((item) => (
              <ContinueLearningCard
                item={item}
                key={item.id}
                onPress={() =>
                  navigation.navigate("CourseDetail", {
                    courseId: item.id,
                  })
                }
              />
            ))
          )}
        </ScrollView>

        <Text className="mb-4 text-lg font-extrabold text-slate-800">
          Mục tiêu hôm nay
        </Text>
        <View
          style={styles.glassCard}
          className="mb-8 rounded-[24px] p-4"
        >
          <View className="flex-row items-center gap-4">
            <GoalProgressRing progress={goalProgressPercent} achievedXp={achievedXp} />

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-500">
                XP đạt được hôm nay
              </Text>
              <Text className="mt-1 text-[10px] text-slate-400">
                Mục tiêu: {targetXp} XP ({goalProgressPercent}%)
              </Text>

              <View className="mt-3 flex-row items-center gap-2">
                <Ionicons
                  name={todayGoal?.isCompleted ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={todayGoal?.isCompleted ? "#10b981" : "#8b5cf6"}
                />
                <Text className="text-xs font-bold text-slate-700">
                  {goalStatusLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="sparkles" size={16} color="#8b5cf6" />
          <Text className="text-lg font-extrabold text-slate-800">
            Best sellers
          </Text>
        </View>

        {recommendationItems.length === 0 ? (
          <View style={styles.glassCard} className="rounded-[24px] p-5">
            <Text className="text-sm font-semibold leading-6 text-slate-600">
              Chua co goi y phu hop luc nay. Vui long quay lai sau.
            </Text>
          </View>
        ) : (
          recommendationItems.map((item) => (
            <CourseCard
              variant="medium"
              title={item.title}
              instructor={item.description}
              rating={item.rating}
              learnersLabel={item.learners}
              priceLabel={item.priceLabel}
              imageUrl={item.imageUrl}
              categoryLabel={item.tag}
              key={item.id}
              onPress={() =>
                navigation.navigate("CourseDetail", {
                  courseId: item.id,
                })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    shadowColor: "#1f2687",
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 24,
    elevation: 2,
  },
  quoteCard: {
    backgroundColor: "transparent",
  },
  quoteContent: {
    position: "relative",
    zIndex: 1,
  },
});
