import type {
  CourseDetailResponse,
  ReviewResponse,
  SectionResponse,
  CreateReviewRequest,
} from "@/types";

import { CourseControllerService } from "./CourseControllerService";
import { CartControllerService } from "./CartControllerService";
import { ReviewControllerService } from "./ReviewControllerService";

export type CourseLectureApi = {
  id?: string;
  title?: string;
  videoUrl?: string;
  lessonType?: string;
} & Record<string, any>;

export type CourseSectionApi = (SectionResponse & {
  lectures?: CourseLectureApi[];
}) &
  Record<string, any>;

export type CourseDetailApi = (CourseDetailResponse & {
  sections?: CourseSectionApi[];
}) &
  Record<string, any>;

export type CourseReviewApi = (ReviewResponse & {
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    fullName?: string;
    avatar?: string;
  };
}) &
  Record<string, any>;

const mapSections = (
  sections: SectionResponse[] | undefined,
): CourseSectionApi[] => {
  return (sections ?? []).map((section) => ({
    ...section,
    lectures: (section.lessons ?? []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      lessonType: lesson.lessonType,
      videoUrl: undefined,
    })),
  }));
};

export const fetchCourseById = async (
  courseId: string | number,
): Promise<CourseDetailApi> => {
  const response = await CourseControllerService.getCourseById({
    id: String(courseId),
  });

  return {
    ...(response.data ?? {}),
    sections: mapSections(
      (response.data as CourseDetailResponse | undefined)?.sections,
    ),
  };
};

export const fetchCourseReviews = async (
  courseId: string | number,
): Promise<CourseReviewApi[]> => {
  const response = await ReviewControllerService.getReviewsByCourseId({
    courseId: String(courseId),
  });

  return (response.data ?? []).map((review) => ({
    ...review,
    comment: review.content ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: review.userId,
      fullName: "Học viên",
      avatar: undefined,
    },
  }));
};

export const addCourseToCart = async (
  courseId: string | number,
): Promise<void> => {
  await CartControllerService.addToCart({
    requestBody: { courseId: String(courseId) },
  });
};

export const submitReview = async ({
  courseId,
  rating,
  comment,
}: {
  courseId: string | number;
  rating: number;
  comment?: string;
}): Promise<void> => {
  await ReviewControllerService.createReview({
    requestBody: {
      courseId: String(courseId),
      rating,
      content: comment,
    } satisfies CreateReviewRequest,
  });
};
