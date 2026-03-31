import type { AxiosResponse } from "axios";

import { mockMyLearningData } from "../mocks/mockMyLearningCalendar";
import { mockDailyGoals, mockDefaultGoals } from "../mocks/mockDailyGoals";
import { mockMyLearningCourses } from "../mocks/mockMyLearningCourses";
import axiosClient from "./axiosClient";
import type {
  DailyGoalsData,
  MyLearningCoursesData,
  MyLearningData,
} from "../../types/myLearning";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface MyCourseApiItem {
  courseId: number;
  title?: string;
  image?: string | null;
  progressPercentage?: number;
  course?: {
    id?: number;
    title?: string;
    thumbnailUrl?: string;
    thumbnail_url?: string;
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

export const fetchMyCourses = async (): Promise<MyCourseApiItem[]> => {
  const response = await axiosClient.get<
    MyCourseApiItem[] | ApiEnvelope<MyCourseApiItem[]>
  >("/learning/my-courses");

  return unwrapData(response);
};

// Simulate network delay (500-1500ms)
const getRandomDelay = () => Math.floor(Math.random() * 1000) + 500;

export const fetchMyLearningDataMock = async (): Promise<MyLearningData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMyLearningData);
    }, getRandomDelay());
  });
};

export const fetchDailyGoalsMock = async (
  day: number,
): Promise<DailyGoalsData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDailyGoals[day] || mockDefaultGoals);
    }, getRandomDelay());
  });
};

export const fetchMyLearningCoursesMock =
  async (): Promise<MyLearningCoursesData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockMyLearningCourses);
      }, getRandomDelay());
    });
  };
