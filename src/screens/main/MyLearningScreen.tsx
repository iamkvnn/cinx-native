import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";

import {
  fetchMyCourses,
  fetchDailyGoalsMock,
  fetchMyLearningCoursesMock,
  fetchMyLearningDataMock,
} from "../../services/api/myLearningApi";
import { useAuthStore } from "../../store/useAuthStore";
import type {
  CompletedCourse,
  DailyGoal,
  MyLearningCourse,
  StreakRange,
} from "../../types/myLearning";
import type { RootStackParamList } from "../../navigation/AppNavigator";

const CALENDAR_CELL_SIZE = 52;
const CALENDAR_DAY_SIZE = 44;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

interface CalendarDay {
  day: number | null;
  hasEvent: boolean;
  streakStatus: "start" | "end" | "single" | "middle" | null;
}

// Goal Icon Component
function GoalIcon({ type }: { type: DailyGoal["type"] }): ReactElement {
  const getIcon = () => {
    switch (type) {
      case "quiz":
        return "help-circle";
      case "video":
        return "play-circle";
      case "code":
        return "code";
      case "add":
        return "plus";
      default:
        return "coffee";
    }
  };

  const getColor = (typ: DailyGoal["type"]) => {
    switch (typ) {
      case "quiz":
        return "#9333ea"; // violet
      case "video":
        return "#9333ea";
      case "code":
        return "#9333ea";
      case "add":
        return "#9333ea";
      default:
        return "#94a3b8";
    }
  };

  return (
    <View
      className={`h-8 w-8 items-center justify-center rounded-full ${
        type === "add" ? "bg-violet-50" : "bg-violet-50"
      }`}
    >
      <Ionicons name={getIcon() as any} size={16} color={getColor(type)} />
    </View>
  );
}

// Goal Item Card
function GoalCard({ goal }: { goal: DailyGoal }): ReactElement {
  const isCompleted = goal.done;

  return (
    <View
      className={`mb-3 flex-row items-center gap-3 rounded-2xl p-3 ${
        isCompleted ? "bg-white/40" : "bg-white/60"
      }`}
      style={styles.glassPanel}
    >
      <GoalIcon type={goal.type} />

      <View className="flex-1">
        <Text
          className={`text-sm font-bold ${
            isCompleted ? "text-slate-400 line-through" : "text-slate-700"
          }`}
        >
          {goal.text}
        </Text>
      </View>

      <View className="rounded-lg border border-white/50 bg-white/50 px-2 py-1">
        <Text className="text-[10px] font-bold text-slate-400">
          {goal.time}
        </Text>
      </View>
    </View>
  );
}

// Course In Progress Card
function CourseInProgressCard({
  course,
  onPress,
}: {
  course: MyLearningCourse;
  onPress: () => void;
}): ReactElement {
  const colorMap = {
    violet: "bg-violet-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 flex-row items-center gap-3 rounded-[28px] bg-white/60 p-2.5"
      style={[styles.glassPanel, { padding: 12 }]}
    >
      <Image
        source={{ uri: course.imageUrl }}
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
              className={colorMap[course.color]}
              style={{ width: `${course.progress}%`, height: "100%" }}
            />
          </View>
          <Text className="text-[10px] font-bold text-slate-400">
            {course.progress}%
          </Text>
        </View>
      </View>

      <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-slate-900">
        <Ionicons name="play" size={14} color="white" />
      </Pressable>
    </Pressable>
  );
}

// Completed Course Card
function CompletedCourseCard({
  course,
}: {
  course: CompletedCourse;
}): ReactElement {
  return (
    <View
      className="mb-4 flex-row items-center gap-3 rounded-[28px] bg-white/60 p-2.5 opacity-90"
      style={styles.glassPanel}
    >
      <View className="relative h-20 w-20 overflow-hidden rounded-2xl">
        <Image
          source={{ uri: course.imageUrl }}
          className="h-full w-full grayscale"
          resizeMode="cover"
        />
        <View className="absolute inset-0 items-center justify-center bg-violet-500/20">
          <Ionicons name="star" size={32} color="white" />
        </View>
      </View>

      <View className="flex-1">
        <Text className="mb-1 text-sm font-bold text-slate-800">
          {course.title}
        </Text>
        <Text className="text-[11px] text-slate-500">
          Hoàn thành: {course.completedDate}
        </Text>
        <View className="mt-2 rounded border border-green-200 bg-green-100 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-green-600">
            Điểm: {course.grade}
          </Text>
        </View>
      </View>

      <Pressable className="rounded-xl border border-white/50 bg-white/30 px-3 py-1.5">
        <Text className="text-[10px] font-bold text-slate-600">Chứng chỉ</Text>
      </Pressable>
    </View>
  );
}

// Month Picker Modal
function MonthPickerModal({
  visible,
  currentMonth,
  currentYear,
  onMonthSelect,
  onYearChange,
  onClose,
}: {
  visible: boolean;
  currentMonth: number;
  currentYear: number;
  onMonthSelect: (month: number) => void;
  onYearChange: (delta: number) => void;
  onClose: () => void;
}): ReactElement {
  if (!visible) return <></>;

  const months = [
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

  return (
    <Pressable
      onPress={onClose}
      className="absolute inset-0 z-20 items-center justify-center bg-black/20"
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        className="mx-6 rounded-2xl border border-white/50 bg-white/90 p-4"
        style={styles.glassModal}
      >
        <View className="mb-4 grid gap-2">
          {/* Month Grid */}
          <View className="grid-cols-3 gap-2">
            {months.map((month, idx) => (
              <Pressable
                key={month}
                onPress={() => {
                  onMonthSelect(idx + 1);
                  onClose();
                }}
                className={`rounded-xl p-2 text-center ${
                  idx + 1 === currentMonth
                    ? "bg-violet-600"
                    : "bg-transparent hover:bg-violet-100"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    idx + 1 === currentMonth ? "text-white" : "text-slate-600"
                  }`}
                >
                  {month}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Year Navigation */}
        <View className="border-t border-slate-200 pt-3 flex-row items-center justify-center gap-4">
          <Pressable onPress={() => onYearChange(-1)} className="p-1">
            <Ionicons name="remove" size={16} color="#7c3aed" />
          </Pressable>
          <Text className="text-sm font-bold text-slate-800">
            {currentYear}
          </Text>
          <Pressable onPress={() => onYearChange(1)} className="p-1">
            <Ionicons name="add" size={16} color="#7c3aed" />
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

// Calendar Day Cell
function CalendarDayCell({
  day,
  hasEvent,
  streakStatus,
  isSelected,
  onPress,
}: {
  day: number | null;
  hasEvent: boolean;
  streakStatus: "start" | "end" | "single" | "middle" | null;
  isSelected: boolean;
  onPress: (day: number) => void;
}): ReactElement {
  if (day === null) {
    return <View style={{ flex: 1 }} />;
  }

  const hasStreakBackground = streakStatus !== null;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Streak Strip Background */}
      {hasStreakBackground && (
        <View
          style={[
            styles.streakStrip,
            streakStatus === "start" && styles.streakStart,
            streakStatus === "end" && styles.streakEnd,
            streakStatus === "single" && styles.streakSingle,
          ]}
        />
      )}

      {/* Day Button */}
      <Pressable
        onPress={() => onPress(day)}
        style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
      >
        <Text
          style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            hasStreakBackground &&
              !isSelected && { color: "#7c3aed", fontWeight: "700" },
          ]}
        >
          {day}
        </Text>

        {/* Event Dot */}
        {hasEvent && (
          <View
            style={[styles.eventDot, isSelected && styles.eventDotSelected]}
          />
        )}
      </Pressable>
    </View>
  );
}

// Main Component
export default function MyLearningScreen(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const [selectedDay, setSelectedDay] = useState(24);
  const [currentMonth, setCurrentMonth] = useState(5); // May
  const [currentYear, setCurrentYear] = useState(2026);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"progress" | "completed">(
    "progress",
  );

  // Animated value for liquid cursor
  const liquidCursorAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const liquidScaleAnim = useRef(new Animated.Value(1)).current;

  const calendarQuery = useQuery({
    queryKey: ["my-learning-calendar"],
    queryFn: fetchMyLearningDataMock,
  });
  const calendarData = calendarQuery.data;
  const calendarLoading = calendarQuery.isLoading;

  const goalsQuery = useQuery({
    queryKey: ["daily-goals", selectedDay],
    queryFn: () => fetchDailyGoalsMock(selectedDay),
  });
  const goalsData = goalsQuery.data;
  const goalsLoading = goalsQuery.isLoading;

  const realCoursesQuery = useQuery({
    queryKey: ["my-learning-real-courses"],
    queryFn: fetchMyCourses,
  });

  const mockCoursesQuery = useQuery({
    queryKey: ["my-learning-courses"],
    queryFn: fetchMyLearningCoursesMock,
  });

  const realInProgressCourses = useMemo<MyLearningCourse[]>(() => {
    return (realCoursesQuery.data ?? []).map((item) => ({
      id: String(item.course?.id ?? item.courseId),
      title: item.course?.title ?? item.title ?? "Khóa học",
      imageUrl:
        item.course?.thumbnailUrl ??
        item.course?.thumbnail_url ??
        item.image ??
        FALLBACK_IMAGE,
      progress: Number(item.progressPercentage ?? 0),
      nextLesson: "Bài học tiếp theo",
      color: "violet",
    }));
  }, [realCoursesQuery.data]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = 31; // May has 31 days
    const startOffset = 4; // Friday

    const days: CalendarDay[] = [];

    // Empty cells
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, hasEvent: false, streakStatus: null });
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      let streakStatus: "start" | "end" | "single" | "middle" | null = null;

      // Check streak ranges
      if (calendarData?.calendar.streakRanges) {
        for (const range of calendarData.calendar.streakRanges) {
          if (day >= range.start && day <= range.end) {
            if (range.start === range.end) {
              streakStatus = "single";
            } else if (day === range.start) {
              streakStatus = "start";
            } else if (day === range.end) {
              streakStatus = "end";
            } else {
              streakStatus = "middle";
            }
            break;
          }
        }
      }

      const hasEvent =
        (streakStatus !== null ||
          day === 24 ||
          day === 5 ||
          calendarData?.calendar.daysWithEvents.includes(day)) ??
        false;

      days.push({ day, hasEvent, streakStatus });
    }

    return days;
  }, [calendarData]);

  const streak = calendarData?.streakStats.currentStreak ?? 0;
  const xp = calendarData?.streakStats.totalXP ?? 0;
  const profileAvatar = (user?.profile as { avatar?: string } | undefined)
    ?.avatar;
  const avatar =
    profileAvatar ?? user?.avatar ?? calendarData?.userAvatar ?? "";

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);

    // Animate liquid cursor
    Animated.parallel([
      Animated.timing(liquidScaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(liquidScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        calendarQuery.refetch(),
        goalsQuery.refetch(),
        realCoursesQuery.refetch(),
        mockCoursesQuery.refetch(),
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
        {/* Header */}
        <View className="px-6 pt-6 pb-6">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black tracking-tight text-slate-800">
                Lịch trình
              </Text>
              <Text className="text-sm font-medium text-slate-500">
                Quản lý thời gian học tập
              </Text>
            </View>
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                className="h-10 w-10 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-10 w-10 rounded-full bg-slate-200" />
            )}
          </View>

          {/* Streak Stats */}
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
                  Chuỗi ngày
                </Text>
                <Text className="text-xl font-black text-slate-800">
                  {streak} Ngày
                </Text>
              </View>
            </View>

            <View className="h-8 w-px bg-slate-200" />

            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                <Ionicons name="flash" size={20} color="#9333ea" />
              </View>
              <View>
                <Text className="text-xs font-bold uppercase text-slate-500">
                  Điểm XP
                </Text>
                <Text className="text-xl font-black text-slate-800">
                  {xp.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar Section */}
        <View className="mx-6 mb-8 rounded-2xl" style={styles.glassPanel}>
          {/* Controls */}
          <View className="mb-4 flex-row items-center justify-between px-4 pt-4">
            <Pressable
              onPress={() => setShowMonthPicker(!showMonthPicker)}
              className="flex-row items-center gap-2 rounded-2xl border border-white/50 bg-white/30 px-4 py-2"
              style={styles.glassButton}
            >
              <Text className="text-center text-lg font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 text-transparent">
                Tháng {currentMonth}, {currentYear}
              </Text>
              <Ionicons
                name={showMonthPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#9ca3af"
              />
            </Pressable>

            <View className="flex-row gap-1">
              {/* Prev/Next Month Buttons */}
              <Pressable className="h-8 w-8 items-center justify-center rounded-full hover:bg-white/50">
                <Ionicons name="chevron-back" size={20} color="#9ca3af" />
              </Pressable>
              <Pressable className="h-8 w-8 items-center justify-center rounded-full hover:bg-white/50">
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {/* Month Picker Modal */}
          <MonthPickerModal
            visible={showMonthPicker}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onMonthSelect={setCurrentMonth}
            onYearChange={(delta) => setCurrentYear(currentYear + delta)}
            onClose={() => setShowMonthPicker(false)}
          />

          {/* Weekday Headers */}
          <View className="mb-2 grid-cols-7 flex-row px-4">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-[10px] font-bold text-slate-400">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          {calendarLoading ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#9333ea" />
            </View>
          ) : (
            <View className="mb-2 px-4">
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, idx) => (
                  <View key={idx} style={styles.calendarGridCell}>
                    <CalendarDayCell
                      day={day.day}
                      hasEvent={day.hasEvent}
                      streakStatus={day.streakStatus}
                      isSelected={day.day === selectedDay}
                      onPress={handleSelectDay}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Daily Goals Section */}
        {goalsLoading ? (
          <View className="mx-6 items-center justify-center py-8">
            <ActivityIndicator size="large" color="#9333ea" />
          </View>
        ) : (
          <>
            <View className="mx-6 mb-3 flex-row items-center justify-between px-1">
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                <Text className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  Mục tiêu ngày {selectedDay}/{currentMonth}
                </Text>
              </View>
              <View className="rounded-full border border-white/50 bg-white/60 px-2 py-0.5 backdrop-blur-sm">
                <Text className="text-[10px] font-bold text-violet-600">
                  {goalsData?.goals.filter((g) => g.done).length ?? 0}/
                  {goalsData?.goals.length ?? 0} Done
                </Text>
              </View>
            </View>

            <View className="mx-6 mb-8 space-y-3">
              {goalsData?.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </View>
          </>
        )}

        {/* Course Tabs */}
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
              Chứng chỉ ({mockCoursesQuery.data?.completed.length ?? 0})
            </Text>
          </Pressable>
        </View>

        {/* Course List */}
        <View className="mx-6 mb-8">
          {activeTab === "progress" ? (
            realCoursesQuery.isLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#9333ea" />
              </View>
            ) : realInProgressCourses.length === 0 ? (
              <View className="items-center justify-center py-6">
                <Text className="text-sm font-semibold text-slate-500">
                  Bạn chưa học khóa nào
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
          ) : mockCoursesQuery.isLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#9333ea" />
            </View>
          ) : (
            (mockCoursesQuery.data?.completed ?? []).map((course) => (
              <CompletedCourseCard key={course.id} course={course} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },
  blob1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(191, 219, 254, 0.4)", // blue-200/40
    opacity: 0.6,
    // animation would go here
  },
  blob2: {
    position: "absolute",
    top: "20%",
    right: "-20%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(221, 214, 254, 0.4)", // violet-200/40
    opacity: 0.6,
  },
  blob3: {
    position: "absolute",
    bottom: "-10%",
    left: "10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(245, 203, 254, 0.4)", // fuchsia-200/40
    opacity: 0.6,
  },
  glassPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    overflow: "hidden",
  },
  glassButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 16,
  },
  glassModal: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 24,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarGridCell: {
    width: "14.285714%",
    aspectRatio: 1,
  },
  calendarDay: {
    width: CALENDAR_DAY_SIZE,
    height: CALENDAR_DAY_SIZE,
    borderRadius: CALENDAR_DAY_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  calendarDaySelected: {
    backgroundColor: "transparent",
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  calendarDayTextSelected: {
    color: "#5c31b3",
    fontWeight: "800",
  },
  streakStrip: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    right: 0,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    zIndex: 0,
  },
  streakStart: {
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    left: 4,
  },
  streakEnd: {
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    right: 4,
  },
  streakSingle: {
    borderRadius: 22,
    left: 4,
    right: 4,
  },
  eventDot: {
    position: "absolute",
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#f472b6",
  },
  eventDotSelected: {
    backgroundColor: "#7c3aed",
  },
});
