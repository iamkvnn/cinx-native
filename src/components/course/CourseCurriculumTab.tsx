import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

import type { CourseSectionApi } from "../../services/api/courseApi";

type CourseCurriculumTabProps = {
  sections: CourseSectionApi[];
  isPurchased: boolean;
  openSections: Record<string, boolean>;
  onToggleSection: (sectionId: string) => void;
};

export default function CourseCurriculumTab({
  sections,
  isPurchased,
  openSections,
  onToggleSection,
}: CourseCurriculumTabProps): ReactElement {
  return (
    <View className="mt-4 gap-3">
      {sections.map((section, sectionIndex) => {
        const sectionId = String(section.id);
        const isOpen = openSections[sectionId] ?? false;
        const lectures = section.lectures ?? [];

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
                  const locked = !isPurchased && lectureIndex > 0;
                  const done =
                    isPurchased && sectionIndex === 0 && lectureIndex === 0;
                  const current =
                    isPurchased && sectionIndex === 0 && lectureIndex === 1;

                  return (
                    <View
                      key={String(lecture.id)}
                      className={`mb-1 flex-row items-center gap-3 rounded-xl p-3 ${
                        locked ? "bg-white/20" : "bg-white/45"
                      }`}
                    >
                      <View
                        className={`h-8 w-8 items-center justify-center rounded-full ${
                          locked
                            ? "bg-slate-100"
                            : done
                              ? "bg-green-100"
                              : "bg-violet-100"
                        }`}
                      >
                        <Ionicons
                          name={
                            locked
                              ? "lock-closed"
                              : done
                                ? "checkmark-circle"
                                : current
                                  ? "play-circle"
                                  : "play"
                          }
                          size={15}
                          color={
                            locked ? "#94a3b8" : done ? "#16a34a" : "#7c3aed"
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
                          {lecture.videoUrl ? "Video" : "Nội dung"}
                        </Text>
                      </View>

                      {!isPurchased && lectureIndex === 0 ? (
                        <Text className="rounded-md bg-violet-50 px-2 py-1 text-xs font-bold text-violet-600">
                          Xem trước
                        </Text>
                      ) : null}
                    </View>
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
