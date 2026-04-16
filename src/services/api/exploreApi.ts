import type { CategoryResponse, CourseResponse } from "@/types";

import { CategoryControllerService } from "./CategoryControllerService";
import { CourseControllerService } from "./CourseControllerService";

export type ExploreCategoryApi = CategoryResponse;

export type ExploreCourseApi = Omit<CourseResponse, "category" | "instructor"> &
  Record<string, any> & {
    category?: { id?: string; name?: string } | string;
    thumbnailUrl?: string;
    thumbnail_url?: string;
    enrollment_count?: number;
    instructor?: {
      id?: string;
      name?: string;
      fullName?: string;
      profile?: { fullName?: string };
    };
  };

export type ExploreCoursesPageApi = {
  data: ExploreCourseApi[];
  page: number;
  totalPages: number;
  totalElements: number;
};

type FetchCoursesParams = {
  pageParam: number;
  categoryId?: string;
  keyword?: string;
  sortBy?: "best_seller" | "newest" | "top_rated" | "price_asc" | "price_desc";
  priceType?: "all" | "free" | "paid";
  isDiscounted?: boolean;
};

const mapCourse = (course: CourseResponse): ExploreCourseApi => {
  const firstImageUrl = course.images?.[0]?.imageUrl;

  return {
    ...(course as CourseResponse & Record<string, any>),
    category:
      typeof course.category === "string"
        ? { id: "", name: course.category }
        : course.category,
    thumbnailUrl: firstImageUrl,
    thumbnail_url: firstImageUrl,
    enrollment_count: Number(course.enrollmentCount ?? 0),
    instructor: {
      ...(course.instructor as Record<string, any>),
      fullName: course.instructor?.name,
      profile: {
        fullName: course.instructor?.name,
      },
    },
  };
};

const sortCourses = (
  courses: ExploreCourseApi[],
  sortBy: FetchCoursesParams["sortBy"],
): ExploreCourseApi[] => {
  const source = [...courses];

  switch (sortBy) {
    case "best_seller":
      return source.sort(
        (a, b) =>
          Number(b.enrollmentCount ?? b.enrollment_count ?? 0) -
          Number(a.enrollmentCount ?? a.enrollment_count ?? 0),
      );
    case "top_rated":
      return source.sort(
        (a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0),
      );
    case "price_asc":
      return source.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
    case "price_desc":
      return source.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
    case "newest":
    default:
      return source.sort(
        (a, b) =>
          new Date(String(b.createdAt ?? 0)).getTime() -
          new Date(String(a.createdAt ?? 0)).getTime(),
      );
  }
};

const filterCourses = (
  courses: ExploreCourseApi[],
  params: Pick<FetchCoursesParams, "priceType" | "isDiscounted">,
): ExploreCourseApi[] => {
  return courses.filter((course) => {
    const price = Number(course.price ?? 0);
    const discountedPrice = Number(course.discountedPrice ?? 0);

    if (params.priceType === "free" && price > 0) {
      return false;
    }

    if (params.priceType === "paid" && price <= 0) {
      return false;
    }

    if (
      params.isDiscounted &&
      !(discountedPrice > 0 && discountedPrice < price)
    ) {
      return false;
    }

    return true;
  });
};

export const fetchCategories = async (): Promise<ExploreCategoryApi[]> => {
  const response = await CategoryControllerService.getAllCategories();
  return response.data ?? [];
};

export const fetchFeaturedCourse =
  async (): Promise<ExploreCourseApi | null> => {
    const response = await CourseControllerService.getAllCourses({
      page: 1,
      size: 12,
    });

    const courses = (response.data ?? []).map(mapCourse);
    const sorted = sortCourses(courses, "best_seller");
    return sorted[0] ?? null;
  };

export const fetchCourses = async (
  params: FetchCoursesParams,
): Promise<ExploreCoursesPageApi> => {
  const response = await CourseControllerService.getAllCourses({
    page: params.pageParam,
    size: 10,
    query: params.keyword || undefined,
    categoryId: params.categoryId || undefined,
  });

  const mapped = (response.data ?? []).map(mapCourse);
  const filtered = filterCourses(mapped, {
    priceType: params.priceType,
    isDiscounted: params.isDiscounted,
  });
  const sorted = sortCourses(filtered, params.sortBy);

  return {
    data: sorted,
    page: Number(response.meta?.page ?? params.pageParam),
    totalPages: Number(response.meta?.totalPages ?? params.pageParam),
    totalElements: Number(response.meta?.totalElements ?? sorted.length),
  };
};
