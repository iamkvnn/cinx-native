import type { AxiosResponse } from "axios";

import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface ExploreCategoryApi {
  id: number;
  name: string;
}

export interface ExploreInstructorApi {
  fullName?: string;
  profile?: {
    fullName?: string;
  };
}

export interface ExploreCourseApi {
  id: number;
  title?: string;
  price?: number | string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  category?: {
    id?: number;
    name?: string;
  };
  instructor?: ExploreInstructorApi;
  enrollmentCount?: number;
  enrollment_count?: number;
}

export interface ExploreCoursesPageApi {
  data: ExploreCourseApi[];
  total: number;
  page: number;
  totalPages: number;
}

interface FetchCoursesParams {
  pageParam?: number;
  categoryId?: string;
  keyword?: string;
  sortBy?: "best_seller" | "newest" | "top_rated" | "price_asc" | "price_desc";
  priceType?: "all" | "free" | "paid";
  isDiscounted?: boolean;
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

export const fetchCategories = async (): Promise<ExploreCategoryApi[]> => {
  const response = await axiosClient.get<
    ExploreCategoryApi[] | ApiEnvelope<ExploreCategoryApi[]>
  >("/categories");

  return unwrapData(response);
};

export const fetchFeaturedCourse =
  async (): Promise<ExploreCourseApi | null> => {
    const response = await axiosClient.get<
      ExploreCourseApi[] | ApiEnvelope<ExploreCourseApi[]>
    >("/courses/top-discounted");

    const courses = unwrapData(response);
    return courses[0] ?? null;
  };

export const fetchCourses = async ({
  pageParam = 1,
  categoryId,
  keyword,
  sortBy = "newest",
  priceType = "all",
  isDiscounted = false,
}: FetchCoursesParams): Promise<ExploreCoursesPageApi> => {
  const response = await axiosClient.get<
    ExploreCoursesPageApi | ApiEnvelope<ExploreCoursesPageApi>
  >("/courses", {
    params: {
      page: pageParam,
      limit: 10,
      categoryId: categoryId || undefined,
      keyword: keyword?.trim() ? keyword.trim() : undefined,
      sortBy,
      priceType,
      isDiscounted,
    },
  });

  const payload = response.data as
    | ExploreCoursesPageApi
    | ApiEnvelope<ExploreCoursesPageApi>;

  // /courses returns paginated object with { data, page, totalPages, total }.
  // If backend wraps payload as envelope, unwrap once; otherwise use payload directly.
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>) &&
    "page" in (payload as Record<string, unknown>)
  ) {
    return payload as ExploreCoursesPageApi;
  }

  return unwrapData(response);
};
