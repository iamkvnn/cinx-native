export type CourseLifecycleStatus =
  | "DRAFT"
  | "WAITING_APPROVAL"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export interface CourseLifecycleLike {
  status?: string | null;
  isPublished?: boolean | null;
}

const STATUS_META: Record<
  CourseLifecycleStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: "Bản nháp", color: "#94a3b8" },
  WAITING_APPROVAL: { label: "Chờ duyệt", color: "#f59e0b" },
  PUBLISHED: { label: "Đã công khai", color: "#10b981" },
  REJECTED: { label: "Bị từ chối", color: "#ef4444" },
  ARCHIVED: { label: "Đã lưu trữ", color: "#64748b" },
};

const normalizeStatus = (
  status?: string | null,
): CourseLifecycleStatus | null => {
  const value = String(status ?? "")
    .trim()
    .toUpperCase();

  if (
    value === "DRAFT" ||
    value === "WAITING_APPROVAL" ||
    value === "PUBLISHED" ||
    value === "REJECTED" ||
    value === "ARCHIVED"
  ) {
    return value;
  }

  return null;
};

export const getCourseLifecycleStatus = (
  course: CourseLifecycleLike,
): CourseLifecycleStatus => {
  const normalizedStatus = normalizeStatus(course.status);

  if (normalizedStatus) {
    return normalizedStatus;
  }

  return course.isPublished ? "PUBLISHED" : "DRAFT";
};

export const getCourseLifecycleLabel = (
  course: CourseLifecycleLike,
): string => {
  return STATUS_META[getCourseLifecycleStatus(course)].label;
};

export const getCourseLifecycleColor = (
  course: CourseLifecycleLike,
): string => {
  return STATUS_META[getCourseLifecycleStatus(course)].color;
};

export const isCoursePublished = (course: CourseLifecycleLike): boolean => {
  return getCourseLifecycleStatus(course) === "PUBLISHED";
};
