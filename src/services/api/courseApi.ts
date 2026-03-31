import type { AxiosResponse } from "axios";

import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface CourseLectureApi {
  id: number;
  title?: string;
  videoUrl?: string;
  contentText?: string;
  orderIndex?: number;
}

export interface CourseSectionApi {
  id: number;
  title?: string;
  orderIndex?: number;
  lectures?: CourseLectureApi[];
}

export interface CourseReviewApi {
  id: number;
  rating?: number;
  comment?: string;
  createdAt?: string;
  userId?: string;
  user?: {
    id?: number;
    fullName?: string;
    avatar?: string;
  };
}

export interface CourseReviewsResponseApi {
  averageRating?: number;
  totalReviews?: number;
  reviews?: CourseReviewApi[];
}

export interface CourseDetailApi {
  id: number;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  price?: number;
  discountPercent?: number;
  enrollmentCount?: number;
  enrollment_count?: number;
  category?: {
    id?: number;
    name?: string;
  };
  instructor?: {
    id?: number;
    fullName?: string;
    profile?: {
      fullName?: string;
      avatar?: string;
    };
  };
  tags?: Array<{
    id?: number;
    name?: string;
  }>;
  sections?: CourseSectionApi[];
}

const unwrapData = <T>(response: AxiosResponse<T | ApiEnvelope<T>>): T => {
  const payload = response.data;

  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

export const fetchCourseById = async (
  courseId: number | string,
): Promise<CourseDetailApi> => {
  const response = await axiosClient.get<
    CourseDetailApi | ApiEnvelope<CourseDetailApi>
  >(`/courses/${courseId}`);

  return unwrapData(response);
};

export const addCourseToCart = async (
  courseId: number,
): Promise<{ message?: string }> => {
  const response = await axiosClient.post<
    { message?: string } | ApiEnvelope<{ message?: string }>
  >("/cart", {
    courseId,
  });

  return unwrapData(response);
};

export const fetchCourseReviews = async (
  courseId: number | string,
): Promise<CourseReviewsResponseApi> => {
  const response = await axiosClient.get<
    CourseReviewsResponseApi | ApiEnvelope<CourseReviewsResponseApi>
  >(`/reviews/course/${courseId}`);

  const payload = unwrapData(response);

  return {
    averageRating: Number(payload?.averageRating ?? 0),
    totalReviews: Number(
      payload?.totalReviews ?? payload?.reviews?.length ?? 0,
    ),
    reviews: (payload?.reviews ?? []).map((review) => ({
      ...review,
      userId: String(review.user?.id ?? review.userId ?? ""),
    })),
  };
};

export interface SubmitReviewPayload {
  courseId: string;
  rating: number;
  comment: string;
}

export const submitReview = async (
  data: SubmitReviewPayload,
): Promise<{ message?: string }> => {
  const response = await axiosClient.post<
    { message?: string } | ApiEnvelope<{ message?: string }>
  >("/reviews", data);

  return unwrapData(response);
};
