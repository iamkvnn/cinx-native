import type { CourseResponse } from "@/types";

import { CourseControllerService } from "./CourseControllerService";

export type RecommendationCourseApi = CourseResponse &
  Record<string, any> & {
    thumbnailUrl?: string;
    thumbnail_url?: string;
    enrollment_count?: number;
  };

const toRecommendation = (course: CourseResponse): RecommendationCourseApi => {
  const firstImageUrl = course.images?.[0]?.imageUrl;

  return {
    ...(course as CourseResponse & Record<string, any>),
    thumbnailUrl: firstImageUrl,
    thumbnail_url: firstImageUrl,
    enrollment_count: Number(course.enrollmentCount ?? 0),
  };
};

export const fetchRecommendations = async (): Promise<
  RecommendationCourseApi[]
> => {
  const response = await CourseControllerService.getAllCourses({
    page: 1,
    size: 12,
  });

  const courses = response.data ?? [];

  return courses
    .map(toRecommendation)
    .sort(
      (a, b) =>
        Number(b.enrollmentCount ?? b.enrollment_count ?? 0) -
        Number(a.enrollmentCount ?? a.enrollment_count ?? 0),
    );
};
