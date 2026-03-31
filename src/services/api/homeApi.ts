import type { AxiosResponse } from "axios";

import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface RecommendationCourseApi {
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

export const fetchRecommendations = async (): Promise<
  RecommendationCourseApi[]
> => {
  const response = await axiosClient.get<
    RecommendationCourseApi[] | ApiEnvelope<RecommendationCourseApi[]>
  >("/courses/best-sellers");

  return unwrapData(response);
};
