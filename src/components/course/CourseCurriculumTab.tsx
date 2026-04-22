import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

import type { SectionResponse } from "@/types";

type CourseCurriculumTabProps = {
  sections: SectionResponse[];
  isPurchased: boolean;
  openSections: Record<string, boolean>;
  completedLessonIds: string[];
  onToggleSection: (sectionId: string) => void;
  onPressLesson: (
    lesson: NonNullable<SectionResponse["lessons"]>[number],
  ) => void;
};

export default function CourseCurriculumTab({
  sections,
  isPurchased,
  openSections,
  completedLessonIds,
  onToggleSection,
  onPressLesson,
}: CourseCurriculumTabProps): ReactElement {
  return (
    <View className="mt-4 gap-3">
      {sections.map((section, sectionIndex) => {
        const sectionId = String(section.id);
        const isOpen = openSections[sectionId] ?? false;
        const lectures = [...(section.lessons ?? [])].sort(
          (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
        );

        return (
          <View
            key={sectionId}
            className="overflow-hidden rounded-3xl border border-white/70 bg-white/65"
          >
            <Pressable
              className="flex-row items-center justify-between px-4 py-4"
              onPress={() => onToggleSection(sectionId)}
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-bold text-slate-800">
                  {section.title ?? `Chương ${sectionIndex + 1}`}
                </Text>
                <Text className="mt-1 text-[11px] font-semibold text-slate-500">
                  {lectures.length} Bài học
                </Text>
              </View>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color="#94a3b8"
              />
            </Pressable>

            {isOpen ? (
              <View className="px-2 pb-2">
                {lectures.map((lecture, lectureIndex) => {
                  const rawLesson = lecture as {
                    id?: string;
                    lessonId?: string;
                    isPreview?: boolean;
                    lessonType?: string;
                    type?: string;
                  };
                  const lessonId = String(
                    rawLesson.id ?? rawLesson.lessonId ?? "",
                  ).trim();
                  const lessonType = String(
                    rawLesson.lessonType ?? rawLesson.type ?? "",
                  ).toUpperCase();
                  const isPreview = Boolean(rawLesson.isPreview);
                  const isCompleted = completedLessonIds.includes(lessonId);

                  // Lock all lessons if course is not purchased
                  const locked = !isPurchased;
                  const canOpen = !locked && lessonId.length > 0;

                  return (
                    <Pressable
                      key={lessonId || `${sectionId}-${lectureIndex}`}
                      onPress={() => {
                        if (canOpen) {
                          onPressLesson(lecture);
                        }
                      }}
                      disabled={!canOpen}
                      className={`mb-1 flex-row items-center gap-3 rounded-xl p-3 ${
                        locked
                          ? "bg-white/20"
                          : isCompleted
                            ? "bg-emerald-50/90"
                            : "bg-white/45"
                      }`}
                    >
                      <View
                        className={`h-8 w-8 items-center justify-center rounded-full ${
                          locked
                            ? "bg-slate-100"
                            : isCompleted
                              ? "bg-green-100"
                              : "bg-violet-100"
                        }`}
                      >
                        <Ionicons
                          name={
                            locked
                              ? "lock-closed"
                              : isCompleted
                                ? "checkmark-circle"
                                : "play"
                          }
                          size={15}
                          color={
                            locked
                              ? "#94a3b8"
                              : isCompleted
                                ? "#16a34a"
                                : "#7c3aed"
                          }
                        />
                      </View>

                      <View
                        className={`flex-1 ${locked ? "opacity-70" : "opacity-100"}`}
                      >
                        <Text className="text-sm font-bold text-slate-800">
                          {lecture.title ?? "Bài học"}
                        </Text>
                        <Text className="mt-0.5 text-[10px] font-semibold text-slate-500">
                          {lessonType.includes("VIDEO")
                            ? "Video"
                            : lessonType.includes("QUIZ")
                              ? "Quiz"
                              : lessonType.includes("ASSIGNMENT")
                                ? "Assignment"
                                : "Nội dung"}
                        </Text>
                      </View>

                      {/* Removed preview label per request */}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
