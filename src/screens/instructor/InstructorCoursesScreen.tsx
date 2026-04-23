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

import { useAuthStore } from "../../store/useAuthStore";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "@/services/api/CourseControllerService";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#94a3b8",
  WAITING_APPROVAL: "#f59e0b",
  PUBLISHED: "#10b981",
  REJECTED: "#ef4444",
  ARCHIVED: "#64748b",
};

export default function InstructorCoursesScreen() {
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<"pending" | "published">("pending");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["instructor-courses", user?.id],
    queryFn: () => {
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
    }, [refetch])
  );

  const allCourses = data?.data ?? [];

  // Tab "Chờ duyệt": isPublished == false
  const pendingCourses = allCourses.filter(
    (c: any) => !c.isPublished
  );

  // Tab "Đã duyệt": isPublished == true
  const publishedCourses = allCourses.filter(
    (c: any) => c.isPublished
  );

  const courses = activeTab === "pending" ? pendingCourses : publishedCourses;

  const renderItem = ({ item }: { item: any }) => {
    const isPub = Boolean(item.isPublished);
    const statusColor = isPub ? "#10b981" : "#f59e0b";
    const statusLabel = isPub ? "Đã duyệt" : "Chưa duyệt";
    const thumbUrl = item.images?.[0]?.imageUrl ?? item.images?.[0]?.url ?? null;

    return (
      <Pressable
        style={styles.courseCard}
        onPress={() => navigation.navigate("CourseManagement", { courseId: item.id })}
      >
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.courseThumbnail} />
        ) : (
          <View style={[styles.courseThumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="book-outline" size={28} color="#c4b5fd" />
          </View>
        )}
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.courseMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {item.price != null && (
              <Text style={styles.priceText}>
                {item.price === 0 ? "Miễn phí" : `${item.price?.toLocaleString()} ₫`}
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
        <Pressable
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            Chờ duyệt
          </Text>
          {pendingCourses.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCourses.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "published" && styles.tabActive]}
          onPress={() => setActiveTab("published")}
        >
          <Text style={[styles.tabText, activeTab === "published" && styles.tabTextActive]}>
            Đã duyệt
          </Text>
          {publishedCourses.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: "#10b981" }]}>
              <Text style={styles.tabBadgeText}>{publishedCourses.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#7958ee" style={{ marginTop: 40 }} />
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
                {activeTab === "pending" ? "Không có khoá học chờ duyệt" : "Chưa có khoá học nào được duyệt"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "pending"
                  ? "Bấm \"Tạo mới\" để bắt đầu xây dựng khoá học đầu tiên."
                  : "Các khoá học sau khi được admin duyệt sẽ hiển thị ở đây."}
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
  courseTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 6 },
  courseMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
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
  priceText: { fontSize: 12, color: "#7958ee", fontWeight: "600" },
  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#334155", textAlign: "center" },
  emptyText: { color: "#94a3b8", textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
});
