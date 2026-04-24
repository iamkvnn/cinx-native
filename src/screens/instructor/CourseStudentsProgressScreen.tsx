import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../navigation/AppNavigator";
import { LearningProgressControllerService } from "@/services/api/LearningProgressControllerService";
import { UserControllerService } from "@/services/api/UserControllerService";
import { CertificateControllerService } from "@/services/api/CertificateControllerService";

type RouteProps = RouteProp<RootStackParamList, "CourseStudentsProgress">;

type FilterType = "ALL" | "LOW" | "MID" | "COMPLETED";

export default function CourseStudentsProgressScreen() {
  const route = useRoute<RouteProps>();
  const queryClient = useQueryClient();
  const { courseId, courseTitle } = route.params;
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["course-students-progress", courseId],
    queryFn: async () => {

      // 1. Fetch progress
      const progressRes = await LearningProgressControllerService.getCourseProgressByCourseId({
        courseId,
      });
      const progressList = progressRes.data || [];

      if (progressList.length === 0) {
        return [];
      }

      // 2. Fetch users
      const userIds = progressList.map((p) => p.userId).filter(Boolean) as string[];
      // Remove duplicates
      const uniqueIds = Array.from(new Set(userIds));

      let usersMap: Record<string, any> = {};
      try {
        if (uniqueIds.length > 0) {
          const usersRes = await UserControllerService.getUsersByIds({ ids: uniqueIds });
          const users = usersRes.data || [];
          users.forEach((u) => {
            if (u.userId) usersMap[u.userId] = u;
          });
        }
      } catch (e) {
        console.log("Failed to fetch users", e);
      }

      // 3. Fetch certificate requests
      let pendingMap: Record<string, any> = {};
      try {
        const certRes = await CertificateControllerService.getRequestsByCourse({
          courseId,
          status: "PENDING",
          size: 100,
        });
        const requests = certRes.data || [];
        requests.forEach(r => {
          if (r.userId) {
            pendingMap[String(r.userId)] = r;
          }
        });
      } catch (e) {
          console.log("Failed to fetch certificate requests", e);
      }

      // 4. Merge
      const merged = progressList.map((p) => {
        const u = p.userId ? usersMap[p.userId] : null;
        const progressPercentage = Math.round(
          ((p.completedItems || 0) / (p.totalItems || 1)) * 100
        );
        return {
          ...p,
          progressPercentage,
          user: u || { name: "Học viên ẩn danh" },
          certificateRequest: p.userId ? pendingMap[p.userId] : null,
        };
      });

      // Sort by progress descending
      merged.sort((a, b) => b.progressPercentage - a.progressPercentage);

      return merged;
    },
  });

  const handleApproveCertificate = (requestId: string, studentName: string) => {
    Alert.alert(
      "Xác nhận cấp chứng chỉ",
      `Bạn có chắc chắn muốn cấp chứng chỉ cho học viên ${studentName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý cấp",
          onPress: async () => {
            try {
              setIsProcessing(requestId);
              await CertificateControllerService.approveCertificate({ requestId });
              await queryClient.invalidateQueries({ queryKey: ["course-students-progress", courseId] });
              Alert.alert("Thành công", "Đã cấp chứng chỉ thành công.");
            } catch (error: any) {
              const msg = error.response?.data?.message || "Không thể cấp chứng chỉ.";
              Alert.alert("Lỗi", msg);
            } finally {
              setIsProcessing(null);
            }
          }
        }
      ]
    );
  };

  const handleRejectCertificate = (requestId: string, studentName: string) => {
    Alert.alert(
      "Từ chối yêu cầu",
      `Bạn có chắc chắn muốn từ chối cấp chứng chỉ cho học viên ${studentName}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(requestId);
              await CertificateControllerService.rejectCertificate({ requestId });
              await queryClient.invalidateQueries({ queryKey: ["course-students-progress", courseId] });
              Alert.alert("Thành công", "Đã từ chối yêu cầu chứng chỉ.");
            } catch (error: any) {
              const msg = error.response?.data?.message || "Không thể thực hiện yêu cầu.";
              Alert.alert("Lỗi", msg);
            } finally {
              setIsProcessing(null);
            }
          }
        }
      ]
    );
  };

  const students = data || [];

  // Filter
  const filteredStudents = students.filter((s) => {
    if (filter === "ALL") return true;
    if (filter === "LOW") return s.progressPercentage < 50;
    if (filter === "MID") return s.progressPercentage >= 50 && s.progressPercentage < 100;
    if (filter === "COMPLETED") return s.progressPercentage === 100;
    return true;
  });

  const renderFilter = (type: FilterType, label: string) => (
    <Pressable
      style={[styles.filterBtn, filter === type && styles.filterBtnActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderItem = ({ item }: { item: any }) => {
    const avatar = item.user?.avatarUrl;
    const name = item.user?.name || "Học viên";
    const prog = item.progressPercentage;
    const certRequest = item.certificateRequest;

    let progColor = "#7958ee";
    if (prog === 100) progColor = "#10b981";
    else if (prog < 50) progColor = "#f59e0b";

    return (
      <View style={styles.studentCard}>
        <Image
          source={
            avatar
              ? { uri: avatar }
              : { uri: "https://ui-avatars.com/api/?name=" + name }
          }
          style={styles.avatar}
        />
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.name}>{name}</Text>
          </View>
          
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Tiến độ: {prog}%</Text>
            {prog === 100 && (
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            )}
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${prog}%`, backgroundColor: progColor }]} />
          </View>

          {certRequest && (
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.approveBtn, isProcessing === certRequest.id && { opacity: 0.7 }]}
                onPress={() => handleApproveCertificate(certRequest.id, name)}
                disabled={!!isProcessing}
              >
                {isProcessing === certRequest.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.btnText}>Duyệt</Text>
                  </>
                )}
              </Pressable>
              
              <Pressable
                style={[styles.rejectBtn, isProcessing === certRequest.id && { opacity: 0.7 }]}
                onPress={() => handleRejectCertificate(certRequest.id, name)}
                disabled={!!isProcessing}
              >
                <Ionicons name="close" size={14} color="#ef4444" />
                <Text style={styles.rejectBtnText}>Từ chối</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {courseTitle}
        </Text>
        <Text style={styles.subtitle}>Tổng cộng: {students.length} học viên</Text>
      </View>

      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { type: "ALL", label: "Tất cả" },
            { type: "COMPLETED", label: "Hoàn thành" },
            { type: "MID", label: "50% - 99%" },
            { type: "LOW", label: "Dưới 50%" },
          ]}
          keyExtractor={(i) => i.type}
          renderItem={({ item }) => renderFilter(item.type as FilterType, item.label)}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#7958ee" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) => item.userId || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không tìm thấy học viên nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerInfo: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  courseTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },

  filtersWrapper: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterBtnActive: { backgroundColor: "#f3f0ff", borderColor: "#7958ee" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#7958ee" },

  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  studentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f1f5f9" },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
  
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  progressText: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  progressBarBg: { height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },

  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  approveBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rejectBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  btnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  rejectBtnText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#94a3b8", fontSize: 15, marginTop: 12 },
});
