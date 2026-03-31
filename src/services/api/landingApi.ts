import type { AxiosResponse } from "axios";

import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface BackendCourse {
  id: number;
  title?: string;
  price?: number | string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  enrollmentCount?: number;
  enrollment_count?: number;
  instructor?: {
    fullName?: string;
    profile?: {
      fullName?: string;
    };
  };
  category?: {
    name?: string;
  };
}

export interface BackendCourseReview {
  id: number;
  comment?: string;
  rating?: number;
  user?: {
    id?: number;
    fullName?: string;
    avatar?: string;
  };
}

export interface BackendCourseReviewsResponse {
  averageRating: number;
  totalReviews: number;
  reviews: BackendCourseReview[];
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

export const fetchBestSellers = async (): Promise<BackendCourse[]> => {
  const response = await axiosClient.get<
    BackendCourse[] | ApiEnvelope<BackendCourse[]>
  >("/courses/best-sellers");

  return unwrapData(response);
};

export const fetchTopReviews = async (
  courseId: number,
): Promise<BackendCourseReview[]> => {
  const response = await axiosClient.get<
    BackendCourseReviewsResponse | ApiEnvelope<BackendCourseReviewsResponse>
  >(`/reviews/course/${courseId}`);

  const payload = unwrapData(response);
  return payload.reviews ?? [];
};
