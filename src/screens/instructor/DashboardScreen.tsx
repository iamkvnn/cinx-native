import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../store/useAuthStore";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "@/services/api/CourseControllerService";
import { LearningProgressControllerService } from "@/services/api/LearningProgressControllerService";
import { ReviewControllerService } from "@/services/api/ReviewControllerService";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch courses
  const {
    data: coursesData,
    isLoading: isLoadingCourses,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["instructor-courses-dashboard", user?.id],
    queryFn: () => {
      return CourseControllerService.getAllCourses({
        instructorId: user?.id,
        size: 100,
      });
    },
    enabled: Boolean(user?.id),
  });

  const courses = coursesData?.data || [];
  const publishedCourses = courses.filter((c) => c.isPublished);

  // 2. Fetch progress & reviews for published courses
  const {
    data: detailsData,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: ["instructor-dashboard-details", publishedCourses.map((c) => c.id).join(",")],
    queryFn: async () => {
      if (publishedCourses.length === 0) {
        return { progressMap: {}, recentReviews: [] };
      }

      // Fetch progress
      const progressPromises = publishedCourses.map((c) =>
        LearningProgressControllerService.getCourseProgressByCourseId({ courseId: c.id! })
          .then((res) => ({ courseId: c.id, progressList: res.data || [] }))
          .catch(() => ({ courseId: c.id, progressList: [] }))
      );

      // Fetch reviews
      const reviewsPromises = publishedCourses.map((c) =>
        ReviewControllerService.getReviewsByCourseId({ courseId: c.id! })
          .then((res) => ({ courseId: c.id, reviews: res.data || [] }))
          .catch(() => ({ courseId: c.id, reviews: [] }))
      );

      const [progressResults, reviewsResults] = await Promise.all([
        Promise.all(progressPromises),
        Promise.all(reviewsPromises),
      ]);

      const progressMap: Record<string, number> = {};
      progressResults.forEach((r) => {
        if (r.progressList.length > 0) {
          const avg =
            r.progressList.reduce((sum, p) => sum + ((p.completedItems || 0) / (p.totalItems || 1) * 100), 0) /
            r.progressList.length;
          progressMap[r.courseId as string] = Math.round(avg);
        } else {
          progressMap[r.courseId as string] = 0;
        }
      });

      let allReviews: any[] = [];
      reviewsResults.forEach((r) => {
        const course = publishedCourses.find((c) => c.id === r.courseId);
        const revs = r.reviews.map((rev) => ({ ...rev, courseName: course?.title }));
        allReviews = [...allReviews, ...revs];
      });

      // Sort reviews by date descending
      allReviews.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      return {
        progressMap,
        recentReviews: allReviews.slice(0, 10),
      };
    },
    enabled: publishedCourses.length > 0,
  });

  useFocusEffect(
    useCallback(() => {
      refetchCourses();
      refetchDetails();
    }, [refetchCourses, refetchDetails])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchCourses();
    await refetchDetails();
    setRefreshing(false);
  };

  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const avgRating = publishedCourses.length
    ? (
        publishedCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / publishedCourses.length
      ).toFixed(1)
    : "0.0";

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color="#f59e0b"
        />
      );
    }
    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Giảng Viên</Text>
        <Text style={styles.headerSubtitle}>Tổng quan hiệu suất giảng dạy</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoadingCourses || isLoadingDetails ? (
          <ActivityIndicator size="large" color="#7958ee" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── STATS GRID ───────────────────────────────────── */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: "#7958ee" }]}>
                <Ionicons name="people" size={28} color="#fff" style={styles.statIcon} />
                <Text style={styles.statValue}>{totalStudents}</Text>
                <Text style={styles.statLabel}>Tổng học viên</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#10b981" }]}>
                <Ionicons name="library" size={28} color="#fff" style={styles.statIcon} />
                <Text style={styles.statValue}>{publishedCourses.length}</Text>
                <Text style={styles.statLabel}>Khoá học active</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#f59e0b", width: "100%", marginTop: 12 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text style={styles.statLabel}>Đánh giá trung bình</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Text style={styles.statValue}>{avgRating}</Text>
                      {renderStars(Number(avgRating))}
                    </View>
                  </View>
                  <Ionicons name="star" size={36} color="#fff" style={{ opacity: 0.8 }} />
                </View>
              </View>
            </View>

            {/* ── COURSE LIST ───────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Học viên từng khoá học</Text>
            {publishedCourses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có khoá học nào được duyệt.</Text>
              </View>
            ) : (
              publishedCourses.map((course) => {
                const progress = detailsData?.progressMap[course.id as string] || 0;
                const thumbUrl = course.images?.[0]?.imageUrl ?? (course.images?.[0] as any)?.url;

                return (
                  <Pressable 
                    key={course.id} 
                    style={styles.courseItem}
                    onPress={() => navigation.navigate("CourseStudentsProgress", { 
                      courseId: course.id as string, 
                      courseTitle: course.title as string 
                    })}
                  >
                    <Image
                      source={thumbUrl ? { uri: thumbUrl } : require("../../../assets/icon.png")}
                      style={styles.courseThumb}
                    />
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseName} numberOfLines={2}>
                        {course.title}
                      </Text>
                      <View style={styles.courseMeta}>
                        <View style={styles.metaBadge}>
                          <Ionicons name="people" size={14} color="#64748b" />
                          <Text style={styles.metaText}>{course.enrollmentCount || 0} học viên</Text>
                        </View>
                        <View style={styles.metaBadge}>
                          <Ionicons name="star" size={14} color="#f59e0b" />
                          <Text style={styles.metaText}>{course.rating?.toFixed(1) || "0.0"}</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <Text style={styles.progressLabel}>Tiến độ trung bình: {progress}%</Text>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                      </View>
                    </View>
                    <View style={{ justifyContent: 'center', paddingLeft: 8 }}>
                      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </View>
                  </Pressable>
                );
              })
            )}

            {/* ── RECENT REVIEWS ────────────────────────────────── */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Đánh giá mới nhất</Text>
            {(!detailsData?.recentReviews || detailsData.recentReviews.length === 0) ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
              </View>
            ) : (
              detailsData.recentReviews.map((review, index) => (
                <View key={review.id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Image
                      source={
                        review.userAvatar
                          ? { uri: review.userAvatar }
                          : { uri: "https://ui-avatars.com/api/?name=" + (review.userFullName || "User") }
                      }
                      style={styles.reviewAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewerName}>{review.userFullName || "Học viên"}</Text>
                      <Text style={styles.reviewCourseName} numberOfLines={1}>
                        {review.courseName}
                      </Text>
                    </View>
                    {renderStars(review.rating || 5)}
                  </View>
                  <Text style={styles.reviewContent}>{review.content}</Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  headerSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  scrollContent: { padding: 16, paddingBottom: 60 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: (width - 44) / 2, // 2 columns with gap
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statIcon: { opacity: 0.8, marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 13, fontWeight: "600", color: "#fff", opacity: 0.9, marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  emptyBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  emptyText: { color: "#94a3b8", fontSize: 14 },

  courseItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  courseThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#f1f5f9" },
  courseInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  courseName: { fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 6 },
  courseMeta: { flexDirection: "row", gap: 12, marginBottom: 10 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#64748b", fontWeight: "500" },

  progressLabel: { fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "500" },
  progressBarBg: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#7958ee", borderRadius: 3 },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f5f9" },
  reviewerName: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  reviewCourseName: { fontSize: 12, color: "#64748b", marginTop: 2 },
  reviewContent: { fontSize: 14, color: "#334155", lineHeight: 22 },
});
