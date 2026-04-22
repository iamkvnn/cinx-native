import type {
  CourseDetailResponse,
  LessonResponse,
  LearningItemProgressResponse,
} from "@/types";

export type LessonRouteName =
  | "VideoLesson"
  | "ArticleLesson"
  | "QuizLesson"
  | "AssignmentLesson";

export const flattenCourseLessons = (
  course?: CourseDetailResponse | null,
): LessonResponse[] => {
  const sections = [...(course?.sections ?? [])].sort(
    (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
  );

  return sections.flatMap((section) => {
    return [...(section.lessons ?? [])].sort(
      (a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0),
    );
  });
};

export const findNextLesson = (
  course?: CourseDetailResponse | null,
  currentLessonId?: string,
): LessonResponse | null => {
  const lessonId = String(currentLessonId ?? "").trim();

  if (!lessonId) {
    return null;
  }

  const lessons = flattenCourseLessons(course);
  const currentIndex = lessons.findIndex(
    (lesson) => String(lesson.id ?? "") === lessonId,
  );

  if (currentIndex < 0 || currentIndex >= lessons.length - 1) {
    return null;
  }

  return lessons[currentIndex + 1] ?? null;
};

export const findPreviousLesson = (
  course?: CourseDetailResponse | null,
  currentLessonId?: string,
): LessonResponse | null => {
  const lessonId = String(currentLessonId ?? "").trim();

  if (!lessonId) {
    return null;
  }

  const lessons = flattenCourseLessons(course);
  const currentIndex = lessons.findIndex(
    (lesson) => String(lesson.id ?? "") === lessonId,
  );

  if (currentIndex <= 0) {
    return null;
  }

  return lessons[currentIndex - 1] ?? null;
};

export const getLessonRouteName = (
  lessonType?: string,
): LessonRouteName | null => {
  const type = String(lessonType ?? "").toUpperCase();

  if (type.includes("VIDEO")) {
    return "VideoLesson";
  }

  if (type.includes("ARTICLE") || type.includes("CONTENT")) {
    return "ArticleLesson";
  }

  if (type.includes("QUIZ")) {
    return "QuizLesson";
  }

  if (type.includes("ASSIGNMENT")) {
    return "AssignmentLesson";
  }

  return null;
};

export const extractCompletedLessonIds = (
  items?: LearningItemProgressResponse[] | null,
): string[] => {
  return (items ?? [])
    .filter((item) => Boolean(item.isCompleted))
    .map((item) => String(item.itemId ?? "").trim())
    .filter(Boolean);
};
