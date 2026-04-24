import { Ionicons } from "@expo/vector-icons";
import type { CourseDetailResponse } from "@/types";
import { type ReactElement, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getLessonRouteName,
  type LessonRouteName,
} from "../../utils/lessonFlow";
import { CertificateControllerService } from "../../services/api/CertificateControllerService";

type LessonDrawerProps = {
  visible: boolean;
  course?: CourseDetailResponse | null;
  currentLessonId: string;
  completedLessonIds?: string[];
  onClose: () => void;
  onSelectLesson: (
    routeName: LessonRouteName,
    lessonId: string,
    lessonTitle: string,
  ) => void;
};

export default function LessonDrawer({
  visible,
  course,
  currentLessonId,
  completedLessonIds = [],
  onClose,
  onSelectLesson,
}: LessonDrawerProps): ReactElement | null {
  const queryClient = useQueryClient();
  const courseId = String(course?.id || "");
  
  const [isRequesting, setIsRequesting] = useState(false);

  const sections = useMemo(() => {
    return [...(course?.sections ?? [])].sort(
      (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
    );
  }, [course?.sections]);

  const progressPercent = useMemo(() => {
    if (!course || !course.sections) return 0;
    const allLessons = course.sections.flatMap(s => s.lessons || []);
    if (allLessons.length === 0) return 0;
    const completedCount = allLessons.filter(l => {
      const lid = String(l.id || (l as any).lessonId || "");
      return lid && completedLessonIds.includes(lid);
    }).length;
    return Math.round((completedCount / allLessons.length) * 100);
  }, [course, completedLessonIds]);

  const certQuery = useQuery({
    queryKey: ["my-certificate", courseId],
    queryFn: () => CertificateControllerService.getMyCertificate({ courseId }),
    enabled: !!courseId && progressPercent === 100,
    retry: false,
  });

  const certificateStatus = certQuery.data?.data?.status; // PENDING, APPROVED, REJECTED

  const handleApplyCertificate = async () => {
    if (isRequesting) return;
    try {
      setIsRequesting(true);
      await CertificateControllerService.applyForCertificate({ courseId });
      await queryClient.invalidateQueries({ queryKey: ["my-certificate", courseId] });
      Alert.alert("Thành công", "Yêu cầu cấp chứng chỉ của bạn đã được gửi đến giảng viên.");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể gửi yêu cầu.";
      Alert.alert("Thông báo", msg);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50">
      <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

      <View className="absolute right-0 top-0 bottom-0 w-[82%] border-l border-slate-200 bg-white">
        <View className="border-b border-slate-200 px-4 py-4 flex-row items-center justify-between">
          <Text className="text-base font-black text-slate-900">
            Nội dung khóa học
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-3 py-3 gap-3"
        >
          {progressPercent === 100 && (
            <View className="mb-2 p-4 rounded-2xl bg-violet-50 border border-violet-100 items-center">
              <Ionicons name="ribbon-outline" size={32} color="#7c3aed" />
              <Text className="text-sm font-bold text-slate-800 mt-2 text-center">
                Bạn đã hoàn thành khóa học!
              </Text>
              
              {!certificateStatus ? (
                <Pressable
                  className="mt-3 bg-violet-600 px-4 py-2.5 rounded-xl flex-row items-center gap-2"
                  onPress={handleApplyCertificate}
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text className="text-xs font-bold text-white">Yêu cầu chứng chỉ</Text>
                      <Ionicons name="send" size={14} color="#fff" />
                    </>
                  )}
                </Pressable>
              ) : (
                <View className="mt-3 px-4 py-2 rounded-xl bg-slate-200">
                  <Text className="text-xs font-bold text-slate-600">
                    Trạng thái: {certificateStatus === "PENDING" ? "Đang chờ duyệt" : certificateStatus === "APPROVED" ? "Đã cấp" : "Đã từ chối"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {sections.length === 0 ? (
            <Text className="text-xs font-medium text-slate-500 px-2">
              Chưa có danh sách bài học.
            </Text>
          ) : (
            sections.map((section, sectionIndex) => {
              const sectionId = String(section.id ?? sectionIndex);
              const lessons = [...(section.lessons ?? [])].sort(
                (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
              );

              return (
                <View
                  key={sectionId}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-2"
                >
                  <Text className="px-2 py-1 text-xs font-black text-slate-700">
                    {section.title ?? `Chương ${sectionIndex + 1}`}
                  </Text>

                  <View className="gap-1 mt-1">
                    {lessons.map((lesson, lessonIndex) => {
                      const lessonId = String(lesson.id ?? (lesson as any).lessonId ?? "").trim();
                      const routeName = getLessonRouteName(lesson.lessonType);

                      if (!lessonId || !routeName) {
                        return null;
                      }

                      const isActive = lessonId === currentLessonId;
                      const isCompleted = completedLessonIds.includes(lessonId);

                      return (
                        <Pressable
                          key={`${sectionId}-${lessonId}-${lessonIndex}`}
                          className={`rounded-xl px-3 py-2.5 ${
                            isActive
                              ? "bg-violet-100 border border-violet-300"
                              : "bg-white border border-transparent shadow-sm"
                          }`}
                          onPress={() => {
                            onSelectLesson(
                              routeName,
                              lessonId,
                              lesson.title ?? "Bài học",
                            );
                          }}
                        >
                          <View className="flex-row items-center justify-between gap-2">
                            <Text
                              className={`flex-1 text-[13px] font-semibold ${
                                isActive ? "text-violet-700" : "text-slate-700"
                              }`}
                              numberOfLines={2}
                            >
                              {lesson.title ?? "Bài học"}
                            </Text>
                            {isCompleted ? (
                              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            ) : (
                                <Ionicons name="play-circle-outline" size={16} color="#94a3b8" />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}
