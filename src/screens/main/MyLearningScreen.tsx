import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useRef, useState, type ReactElement } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { DailyGoalResponse } from "@/types";
import { LinearGradient } from "expo-linear-gradient";

import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import {
  createDailyGoal,
  fetchMonthlyDailyGoals,
  fetchMyCertificates,
  fetchMyCourses,
  fetchMyStreak,
  toMonthlyGoalProgress,
} from "../../services/api/myLearningApi";
import { useAuthStore } from "../../store/useAuthStore";
import type {
  CompletedCourse,
  MonthlyGoalProgress,
  MyLearningCourse,
} from "../../types/myLearning";
import type { RootStackParamList } from "../../navigation/AppNavigator";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Th 1",
  "Th 2",
  "Th 3",
  "Th 4",
  "Th 5",
  "Th 6",
  "Th 7",
  "Th 8",
  "Th 9",
  "Th 10",
  "Th 11",
  "Th 12",
];

const GOAL_XP_STEP = 50;
const GOAL_XP_MIN = 50;
const GOAL_XP_MAX = 1000;

type CalendarCell = {
  day: number | null;
  hasGoal: boolean;
  isCompleted: boolean;
  isToday: boolean;
};

function formatGoalDate(year: number, month: number, day: number): string {
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
}

function getDayFromGoalDate(goalDate: string | undefined): number | null {
  if (!goalDate) {
    return null;
  }

  const [datePart] = goalDate.split("T");
  const [year, month, day] = datePart.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  return day;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatGoalDateLabel(year: number, month: number, day: number): string {
  return `${day}/${month}/${year}`;
}

function XPGoalSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}): ReactElement {
  const trackWidthRef = useRef(0);
  const horizontalPadding = 16;
  const thumbSize = 32;

  const updateValueFromX = (locationX: number): void => {
    const width = trackWidthRef.current;
    const trackWidth = Math.max(width - horizontalPadding * 2, 0);

    if (trackWidth <= 0) {
      return;
    }

    const relativeX = clamp(locationX - horizontalPadding, 0, trackWidth);
    const ratio = relativeX / trackWidth;
    const nextValue = roundToStep(
      GOAL_XP_MIN + ratio * (GOAL_XP_MAX - GOAL_XP_MIN),
      GOAL_XP_STEP,
    );

    onChange(clamp(nextValue, GOAL_XP_MIN, GOAL_XP_MAX));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (event) => {
          updateValueFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateValueFromX(event.nativeEvent.locationX);
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [],
  );

  const progressRatio = (value - GOAL_XP_MIN) / (GOAL_XP_MAX - GOAL_XP_MIN);
  const trackWidth = Math.max(trackWidthRef.current - horizontalPadding * 2, 0);
  const thumbLeft =
    horizontalPadding + progressRatio * Math.max(trackWidth - thumbSize, 0);

  return (
    <View>
      <View
        className="mt-4 h-14 justify-center rounded-3xl border border-violet-100 bg-white px-4"
        onLayout={(event: LayoutChangeEvent) => {
          trackWidthRef.current = event.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        <View className="absolute left-4 right-4 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-100">
          <LinearGradient
            colors={["#8b5cf6", "#d946ef", "#fb7185"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: `${progressRatio * 100}%`, height: "100%" }}
          />
        </View>

        <View
          className="absolute top-1/2 h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg shadow-violet-500/20"
          style={{ left: thumbLeft }}
        >
          <View className="h-4 w-4 rounded-full bg-violet-600" />
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-between px-1">
        <Text className="text-[10px] font-bold text-slate-400">
          {GOAL_XP_MIN} XP
        </Text>
        <Text className="text-xs font-semibold text-violet-700">
          {value} XP
        </Text>
        <Text className="text-[10px] font-bold text-slate-400">
          {GOAL_XP_MAX} XP
        </Text>
      </View>

      <Text className="mt-1 text-center text-xs font-semibold text-violet-700">
        Mỗi bước nhảy: {GOAL_XP_STEP} XP
      </Text>
    </View>
  );
}

function CourseInProgressCard({
  course,
  onPress,
}: {
  course: MyLearningCourse;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 flex-row items-center gap-3 rounded-[24px] bg-white/70 p-3"
      style={styles.glassPanel}
    >
      <Image
        source={{ uri: course.imageUrl || FALLBACK_IMAGE }}
        className="h-20 w-20 rounded-2xl"
        resizeMode="cover"
      />

      <View className="flex-1 py-1 pr-1">
        <Text
          className="mb-1 text-sm font-bold leading-tight text-slate-800"
          numberOfLines={2}
        >
          {course.title}
        </Text>
        <Text className="mb-2 text-[11px] text-slate-500">
          Tiếp: {course.nextLesson}
        </Text>

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <View
              className="bg-violet-500"
              style={{ width: `${course.progress}%`, height: "100%" }}
            />
          </View>
          <Text className="text-[10px] font-bold text-slate-500">
            {course.progress}%
          </Text>
        </View>
      </View>

      <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-900">
        <Ionicons name="play" size={14} color="white" />
      </View>
    </Pressable>
  );
}

function CompletedCourseCard({
  course,
}: {
  course: CompletedCourse;
}): ReactElement {
  const isApproved = course.statusLabel === "Đã cấp chứng chỉ";

  return (
    <View
      className="mb-4 overflow-hidden rounded-[24px] bg-white/80 p-3"
      style={[styles.glassPanel, { borderColor: "rgba(255,255,255,0.8)" }]}
    >
      <View className="flex-row items-center gap-4">
        <View className="relative h-20 w-20 shadow-sm">
          <Image
            source={{ uri: course.imageUrl || FALLBACK_IMAGE }}
            className="h-full w-full rounded-2xl"
            resizeMode="cover"
          />
          {isApproved && (
            <View className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-sm">
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              <Text
                className="text-[15px] font-black leading-tight text-slate-800"
                numberOfLines={2}
              >
                {course.title}
              </Text>
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Ionicons name="calendar-outline" size={12} color="#64748b" />
                <Text className="text-[11px] font-medium text-slate-500">
                  {course.completedDate}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between">
            <View
              className={`rounded-full px-2.5 py-1 ${
                isApproved
                  ? "bg-emerald-50 border border-emerald-100"
                  : course.statusLabel === "Bị từ chối"
                    ? "bg-red-50 border border-red-100"
                    : "bg-amber-50 border border-amber-100"
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  isApproved
                    ? "text-emerald-700"
                    : course.statusLabel === "Bị từ chối"
                      ? "text-red-700"
                      : "text-amber-700"
                }`}
              >
                {course.statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function CalendarDayCell({
  cell,
  isSelected,
  onPress,
}: {
  cell: CalendarCell;
  isSelected: boolean;
  onPress: (day: number) => void;
}): ReactElement {
  if (cell.day === null) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <View className="flex-1 items-center justify-center py-1">
      <Pressable
        onPress={() => onPress(cell.day!)}
        className={`h-11 w-11 items-center justify-center rounded-full ${
          isSelected
            ? "bg-violet-600"
            : cell.isToday
              ? "border border-violet-300 bg-violet-50"
              : "bg-transparent"
        }`}
      >
        <Text
          className={`text-sm font-bold ${
            isSelected ? "text-white" : "text-slate-700"
          }`}
        >
          {cell.day}
        </Text>

        <View className="absolute bottom-1 flex-row items-center gap-1">
          {cell.hasGoal ? (
            <View
              className={`h-1.5 w-1.5 rounded-full ${
                isSelected ? "bg-white/80" : "bg-amber-500"
              }`}
            />
          ) : null}
          {cell.isCompleted ? (
            <View
              className={`h-1.5 w-1.5 rounded-full ${
                isSelected ? "bg-white" : "bg-emerald-500"
              }`}
            />
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export default function MyLearningScreen(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const now = useMemo(() => new Date(), []);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [goalXpValue, setGoalXpValue] = useState(500);
  const [activeTab, setActiveTab] = useState<"progress" | "completed">(
    "progress",
  );

  const streakQuery = useQuery({
    queryKey: ["my-learning-streak"],
    queryFn: fetchMyStreak,
    enabled: Boolean(user),
    retry: false,
  });

  const monthlyGoalsQuery = useQuery({
    queryKey: ["my-learning-goals-month", currentYear, currentMonth],
    queryFn: () => fetchMonthlyDailyGoals(currentYear, currentMonth),
    enabled: Boolean(user),
    retry: false,
  });

  const realCoursesQuery = useQuery({
    queryKey: ["my-learning-real-courses"],
    queryFn: fetchMyCourses,
    enabled: Boolean(user),
    retry: false,
  });

  const certificatesQuery = useQuery({
    queryKey: ["my-learning-certificates"],
    queryFn: fetchMyCertificates,
    enabled: Boolean(user),
    retry: false,
  });

  const monthlyProgress = useMemo<MonthlyGoalProgress>(() => {
    return toMonthlyGoalProgress(
      currentYear,
      currentMonth,
      monthlyGoalsQuery.data ?? [],
    );
  }, [currentMonth, currentYear, monthlyGoalsQuery.data]);

  const realInProgressCourses = useMemo<MyLearningCourse[]>(() => {
    return (realCoursesQuery.data ?? []).map((item, index) => ({
      id: String(item.course?.id ?? item.courseId),
      title: item.course?.title ?? item.title ?? "Khóa học",
      imageUrl:
        item.course?.images?.[0]?.imageUrl ??
        item.course?.thumbnailUrl ??
        item.course?.thumbnail_url ??
        FALLBACK_IMAGE,
      progress: Number(item.progressPercentage ?? 0),
      nextLesson: "Bài học tiếp theo",
      color: ["violet", "pink", "indigo", "emerald", "amber"][
        index % 5
      ] as MyLearningCourse["color"],
    }));
  }, [realCoursesQuery.data]);

  const completedCourses = (Array.isArray(certificatesQuery.data)
    ? certificatesQuery.data
    : []) as CompletedCourse[];

  const monthlyGoalMap = useMemo(() => {
    const map = new Map<number, DailyGoalResponse>();

    for (const goal of monthlyProgress.days) {
      const day = getDayFromGoalDate(goal.goalDate);
      if (day !== null) {
        map.set(day, goal);
      }
    }

    return map;
  }, [monthlyProgress.days]);

  const calendarCells = useMemo<CalendarCell[]>(() => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const jsFirstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const mondayOffset = (jsFirstDay + 6) % 7;
    const today = new Date();
    const isViewingCurrentMonth =
      today.getFullYear() === currentYear &&
      today.getMonth() + 1 === currentMonth;

    const cells: CalendarCell[] = [];

    for (let i = 0; i < mondayOffset; i += 1) {
      cells.push({
        day: null,
        hasGoal: false,
        isCompleted: false,
        isToday: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const goal = monthlyGoalMap.get(day);
      cells.push({
        day,
        hasGoal: Boolean(goal),
        isCompleted: Boolean(goal?.isCompleted),
        isToday: isViewingCurrentMonth && today.getDate() === day,
      });
    }

    return cells;
  }, [currentMonth, currentYear, monthlyGoalMap]);

  const selectedDayGoal = monthlyGoalMap.get(selectedDay);

  const handleSelectDay = (day: number): void => {
    setSelectedDay(day);
  };

  const handleChangeMonth = (delta: number): void => {
    const base = new Date(currentYear, currentMonth - 1, 1);
    base.setMonth(base.getMonth() + delta);

    const nextYear = base.getFullYear();
    const nextMonth = base.getMonth() + 1;
    const maxDay = new Date(nextYear, nextMonth, 0).getDate();

    setCurrentYear(nextYear);
    setCurrentMonth(nextMonth);
    setSelectedDay((previous) => Math.min(previous, maxDay));
  };

  const handleCreateGoal = async (): Promise<void> => {
    const targetXp = goalXpValue;

    if (!Number.isFinite(targetXp) || targetXp <= 0) {
      Alert.alert("Mục tiêu không hợp lệ", "Nhập số XP lớn hơn 0.");
      return;
    }

    try {
      await createDailyGoal({
        targetXp,
        goalDate: formatGoalDate(currentYear, currentMonth, selectedDay),
      });

      await monthlyGoalsQuery.refetch();
      Alert.alert(
        "Đã tạo goal",
        `Goal ${targetXp} XP cho ngày ${selectedDay}.`,
      );
    } catch (error) {
      Alert.alert(
        "Không thể tạo goal",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        streakQuery.refetch(),
        monthlyGoalsQuery.refetch(),
        realCoursesQuery.refetch(),
        certificatesQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
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
        <View className="px-6 pt-6 pb-6">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black tracking-tight text-slate-800">
                Lịch trình
              </Text>
              <Text className="text-sm font-medium text-slate-500">
                Theo dõi hành trình học tập
              </Text>
            </View>
          </View>

          <View
            className="flex-row items-center justify-between rounded-2xl p-4"
            style={styles.glassPanel}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Ionicons name="flame" size={20} color="#f97316" />
              </View>
              <View>
                <Text className="text-xs font-bold uppercase text-slate-500">
                  Chuỗi hiện tại
                </Text>
                <Text className="text-xl font-black text-slate-800">
                  {Number(streakQuery.data?.currentStreak ?? 0)} ngày
                </Text>
              </View>
            </View>

            <View className="h-8 w-px bg-slate-200" />

            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <Ionicons name="trophy" size={20} color="#9333ea" />
              </View>
              <View>
                <Text className="text-xs font-bold uppercase text-slate-500">
                  Kỷ lục
                </Text>
                <Text className="text-xl font-black text-slate-800">
                  {Number(streakQuery.data?.highestStreak ?? 0)} ngày
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mx-6 mb-6 rounded-2xl" style={styles.glassPanel}>
          <View className="mb-4 flex-row items-center justify-between px-4 pt-4">
            <Pressable
              onPress={() => setShowMonthPicker((v) => !v)}
              className="flex-row items-center gap-2 rounded-2xl border border-white/50 bg-white/30 px-4 py-2"
            >
              <Text className="text-center text-base font-black text-violet-700">
                {MONTH_NAMES[currentMonth - 1]}, {currentYear}
              </Text>
              <Ionicons
                name={showMonthPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#6d28d9"
              />
            </Pressable>

            <View className="flex-row gap-1">
              <Pressable
                onPress={() => handleChangeMonth(-1)}
                className="h-8 w-8 items-center justify-center rounded-full"
              >
                <Ionicons name="chevron-back" size={20} color="#6d28d9" />
              </Pressable>
              <Pressable
                onPress={() => handleChangeMonth(1)}
                className="h-8 w-8 items-center justify-center rounded-full"
              >
                <Ionicons name="chevron-forward" size={20} color="#6d28d9" />
              </Pressable>
            </View>
          </View>

          {showMonthPicker ? (
            <View className="mx-4 mb-3 rounded-2xl border border-white/70 bg-white/80 p-3">
              <View className="flex-row flex-wrap">
                {MONTH_NAMES.map((month, index) => (
                  <Pressable
                    key={month}
                    onPress={() => {
                      setCurrentMonth(index + 1);
                      setShowMonthPicker(false);
                    }}
                    className={`w-1/3 p-2 rounded-lg ${
                      index + 1 === currentMonth ? "bg-violet-600" : ""
                    }`}
                  >
                    <Text
                      className={`text-center text-xs font-bold ${
                        index + 1 === currentMonth
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {month}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mb-2 flex-row px-4">
            {WEEK_DAYS.map((day) => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-[10px] font-bold text-slate-400">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {monthlyGoalsQuery.isLoading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#9333ea" />
            </View>
          ) : (
            <View className="mb-2 px-4 pb-3">
              <View style={styles.calendarGrid}>
                {calendarCells.map((cell, idx) => (
                  <View
                    key={`${cell.day ?? "empty"}-${idx}`}
                    style={styles.calendarGridCell}
                  >
                    <CalendarDayCell
                      cell={cell}
                      isSelected={cell.day === selectedDay}
                      onPress={handleSelectDay}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View
          className="mx-6 mb-6 rounded-2xl bg-white/70 p-4"
          style={styles.glassPanel}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-800">
                Tạo goal mới
              </Text>
              <Text className="mt-1 text-xs font-semibold text-slate-500">
                {formatGoalDateLabel(currentYear, currentMonth, selectedDay)}
              </Text>
            </View>

            <View className="rounded-full bg-violet-50 px-3 py-1.5">
              <Text className="text-sm font-black text-violet-700">
                {goalXpValue} XP
              </Text>
            </View>
          </View>

          <XPGoalSlider value={goalXpValue} onChange={setGoalXpValue} />

          <View className="mt-4 flex-row items-center gap-3">
            <Pressable
              onPress={() => {
                setGoalXpValue(500);
              }}
              className="flex-1 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 py-3"
            >
              <Text className="text-sm font-bold text-violet-700">
                Reset 500 XP
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void handleCreateGoal();
              }}
              className="flex-1 items-center justify-center rounded-2xl bg-violet-600 py-3"
            >
              <Text className="text-sm font-bold text-white">Tạo goal</Text>
            </Pressable>
          </View>
        </View>

        <View
          className="mx-6 mb-6 rounded-2xl bg-white/70 p-4"
          style={styles.glassPanel}
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-black text-slate-800">
              Tiến độ mục tiêu tháng
            </Text>
            {monthlyGoalsQuery.isLoading ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <Text className="text-xs font-bold text-violet-700">
                {monthlyProgress.completedGoals}/{monthlyProgress.totalGoals}
              </Text>
            )}
          </View>

          <View className="h-2 overflow-hidden rounded-full bg-slate-200 mb-3">
            <View
              className="h-full rounded-full bg-violet-600"
              style={{ width: `${monthlyProgress.completionRate}%` }}
            />
          </View>

          <Text className="text-xs font-semibold text-slate-600">
            Tỷ lệ hoàn thành: {monthlyProgress.completionRate}%
          </Text>

          <Text className="mt-2 text-xs font-semibold text-slate-600">
            Ngày {selectedDay}: mục tiêu{" "}
            {Number(selectedDayGoal?.targetXp ?? 0)} XP, đã đạt{" "}
            {Number(selectedDayGoal?.currentXp ?? 0)} XP
          </Text>
        </View>

        <View className="mx-6 mb-6 flex-row rounded-2xl bg-slate-900/5 p-1">
          <Pressable
            onPress={() => setActiveTab("progress")}
            className={`flex-1 rounded-xl py-2.5 ${
              activeTab === "progress" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center text-sm font-bold ${
                activeTab === "progress" ? "text-slate-900" : "text-slate-600"
              }`}
            >
              Đang học ({realInProgressCourses.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("completed")}
            className={`flex-1 rounded-xl py-2.5 ${
              activeTab === "completed" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center text-sm font-bold ${
                activeTab === "completed" ? "text-slate-900" : "text-slate-600"
              }`}
            >
              Chứng chỉ ({completedCourses.length})
            </Text>
          </Pressable>
        </View>

        <View className="mx-6 mb-8">
          {activeTab === "progress" ? (
            realCoursesQuery.isLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#9333ea" />
              </View>
            ) : realInProgressCourses.length === 0 ? (
              <View className="items-center justify-center py-6">
                <Text className="text-sm font-semibold text-slate-500">
                  Bạn chưa có khóa đang học
                </Text>
              </View>
            ) : (
              realInProgressCourses.map((course) => (
                <CourseInProgressCard
                  key={course.id}
                  course={course}
                  onPress={() => {
                    navigation.navigate("CourseDetail", {
                      courseId: course.id,
                    });
                  }}
                />
              ))
            )
          ) : certificatesQuery.isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#9333ea" />
            </View>
          ) : completedCourses.length === 0 ? (
            <View className="items-center justify-center py-6">
              <Text className="text-sm font-semibold text-slate-500">
                Bạn chưa có chứng chỉ nào
              </Text>
            </View>
          ) : (
            completedCourses.map((course) => (
              <CompletedCourseCard key={course.id} course={course} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarGridCell: {
    width: "14.285714%",
    aspectRatio: 1,
  },
});
