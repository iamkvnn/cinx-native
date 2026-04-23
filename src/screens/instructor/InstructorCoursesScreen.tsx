import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { CourseControllerService, OpenAPI } from "../../api/course";
import { useAuthStore } from "../../store/useAuthStore";
import { RootStackParamList } from "../../navigation/AppNavigator";
import {
  getCourseLifecycleColor,
  getCourseLifecycleLabel,
  getCourseLifecycleStatus,
  isCoursePublished,
  type CourseLifecycleStatus,
} from "../../utils/courseStatus";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function InstructorCoursesScreen() {
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<CourseLifecycleStatus>("DRAFT");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["instructor-courses", user?.id],
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (token) OpenAPI.TOKEN = token;
      return CourseControllerService.getAllCourses({
        instructorId: user?.id,
        size: 100,
      });
    },
    enabled: Boolean(user?.id),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const allCourses = data?.data ?? [];

  const coursesByStatus: Record<CourseLifecycleStatus, any[]> = {
    DRAFT: [],
    WAITING_APPROVAL: [],
    PUBLISHED: [],
    REJECTED: [],
    ARCHIVED: [],
  };

  allCourses.forEach((course: any) => {
    const status = getCourseLifecycleStatus(course);
    coursesByStatus[status].push(course);
  });

  const courses = coursesByStatus[activeTab] ?? [];

  const tabConfig: Array<{
    key: CourseLifecycleStatus;
    label: string;
    emptyTitle: string;
    emptyText: string;
  }> = [
    {
      key: "DRAFT",
      label: "Bản nháp",
      emptyTitle: "Không có khoá học bản nháp",
      emptyText: "Các khoá học đang soạn thảo sẽ hiển thị ở đây.",
    },
    {
      key: "WAITING_APPROVAL",
      label: "Chờ duyệt",
      emptyTitle: "Không có khoá học chờ duyệt",
      emptyText: "Những khoá đã gửi admin duyệt sẽ nằm ở đây.",
    },
    {
      key: "PUBLISHED",
      label: "Đã công khai",
      emptyTitle: "Chưa có khoá học công khai",
      emptyText:
        "Khoá học đã được admin duyệt và công khai sẽ xuất hiện ở đây.",
    },
    {
      key: "REJECTED",
      label: "Bị từ chối",
      emptyTitle: "Không có khoá học bị từ chối",
      emptyText:
        "Khoá học bị admin từ chối sẽ hiển thị ở đây để bạn chỉnh sửa lại.",
    },
  ];

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = getCourseLifecycleColor(item);
    const statusLabel = getCourseLifecycleLabel(item);
    const courseStatus = getCourseLifecycleStatus(item);
    const thumbUrl =
      item.images?.[0]?.imageUrl ?? item.images?.[0]?.url ?? null;

    return (
      <Pressable
        style={styles.courseCard}
        onPress={() =>
          navigation.navigate("CourseManagement", { courseId: item.id })
        }
      >
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.courseThumbnail} />
        ) : (
          <View style={[styles.courseThumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="book-outline" size={28} color="#c4b5fd" />
          </View>
        )}
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.courseMeta}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "22" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            <Text style={styles.courseStateText}>
              {courseStatus === "PUBLISHED"
                ? "Đã công khai"
                : courseStatus === "WAITING_APPROVAL"
                  ? "Đang chờ admin duyệt"
                  : courseStatus === "REJECTED"
                    ? "Bị từ chối, cần cập nhật lại"
                    : "Bản nháp"}
            </Text>
            {item.price != null && (
              <Text style={styles.priceText}>
                {item.price === 0
                  ? "Miễn phí"
                  : `${item.price?.toLocaleString()} ₫`}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khoá học của tôi</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateCourse")}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Tạo mới</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = coursesByStatus[tab.key]?.length ?? 0;

          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#7958ee"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#c4b5fd" />
              <Text style={styles.emptyTitle}>
                {tabConfig.find((tab) => tab.key === activeTab)?.emptyTitle ??
                  "Không có khoá học"}
              </Text>
              <Text style={styles.emptyText}>
                {tabConfig.find((tab) => tab.key === activeTab)?.emptyText ??
                  ""}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7958ee",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  createButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#7958ee",
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#7958ee" },
  tabBadge: {
    backgroundColor: "#7958ee",
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    gap: 12,
    paddingRight: 12,
  },
  courseThumbnail: { width: 90, height: 70 },
  thumbnailPlaceholder: {
    backgroundColor: "#f3f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  courseInfo: { flex: 1, paddingVertical: 10 },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  courseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  courseStateText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  priceText: { fontSize: 12, color: "#7958ee", fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#334155",
    textAlign: "center",
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
