import type { CourseDetailResponse } from "@/types";
import { type ReactElement, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  getLessonRouteName,
  type LessonRouteName,
} from "../../utils/lessonFlow";

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
  const sections = useMemo(() => {
    return [...(course?.sections ?? [])].sort(
      (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
    );
  }, [course?.sections]);

  if (!visible) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50">
      <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />

      <View className="absolute right-0 top-0 bottom-0 w-[82%] border-l border-slate-200 bg-white">
        <View className="border-b border-slate-200 px-4 py-4">
          <Text className="text-base font-black text-slate-900">
            Nội dung khóa học
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-3 py-3 gap-3"
        >
          {sections.length === 0 ? (
            <Text className="text-xs font-medium text-slate-500">
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

                  <View className="gap-1">
                    {lessons.map((lesson, lessonIndex) => {
                      const lessonId = String(lesson.id ?? "").trim();
                      const routeName = getLessonRouteName(lesson.lessonType);

                      if (!lessonId || !routeName) {
                        return null;
                      }

                      const isActive = lessonId === currentLessonId;
                      const isCompleted = completedLessonIds.includes(lessonId);

                      return (
                        <Pressable
                          key={`${sectionId}-${lessonId}-${lessonIndex}`}
                          className={`rounded-xl px-3 py-2 ${
                            isActive
                              ? "bg-violet-100 border border-violet-300"
                              : "bg-white border border-transparent"
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
                              className={`flex-1 text-xs font-semibold ${
                                isActive ? "text-violet-700" : "text-slate-700"
                              }`}
                              numberOfLines={2}
                            >
                              {lesson.title ?? "Bài học"}
                            </Text>
                            {isCompleted ? (
                              <Text className="text-[10px] font-black text-emerald-600">
                                DONE
                              </Text>
                            ) : null}
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
