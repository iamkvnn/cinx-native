import type {
  CertificateRequestResponse,
  CourseProgressResponse,
  CourseResponse,
  DailyGoalResponse,
  SetDailyGoalRequest,
  UserStreakResponse,
} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import env from "../../env";

import type {
  CompletedCourse,
  MonthlyGoalProgress,
  MyLearningCourse,
} from "../../types/myLearning";

import { AuthControllerService } from "./AuthControllerService";
import { CertificateControllerService } from "./CertificateControllerService";
import { DailyGoalControllerService } from "./DailyGoalControllerService";
import { EnrollmentControllerService } from "./EnrollmentControllerService";
import { LearningProgressControllerService } from "./LearningProgressControllerService";
import { StreakControllerService } from "./StreakControllerService";

export type MyCourseApiItem = {
  courseId?: string;
  title?: string;
  progressPercentage?: number;
  course?: (CourseResponse & Record<string, any>) | null;
} & Record<string, any>;

export type MyStreakApi = UserStreakResponse;

export type MonthlyDailyGoalApi = DailyGoalResponse;

export type CertificateApi = CertificateRequestResponse;

const persistTokens = async (
  accessToken: string,
  refreshToken?: string,
): Promise<void> => {
  await AsyncStorage.setItem(env.accessToken, accessToken);

  if (refreshToken) {
    await AsyncStorage.setItem(env.refreshToken, refreshToken);
  }
};

const refreshSession = async (): Promise<boolean> => {
  const refreshToken = await AsyncStorage.getItem(env.refreshToken);

  if (!refreshToken) {
    return false;
  }

  const response = await AuthControllerService.refreshToken({
    requestBody: { token: refreshToken },
  });

  const nextTokens = response.data;

  if (!nextTokens?.accessToken) {
    return false;
  }

  await persistTokens(nextTokens.accessToken, nextTokens.refreshToken);
  return true;
};

const mapCourse = (
  course: CourseResponse,
  progressMap: Map<string, CourseProgressResponse>,
): MyCourseApiItem => {
  const courseId = String(course.id ?? "");
  const progress = progressMap.get(courseId);
  const completedItems = Number(progress?.completedItems ?? 0);
  const totalItems = Number(progress?.totalItems ?? 0);
  const progressPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    courseId,
    title: course.title,
    progressPercentage,
    course: course as CourseResponse & Record<string, any>,
  };
};

export const fetchMyCourses = async (): Promise<MyCourseApiItem[]> => {
  const enrolledResponse = await EnrollmentControllerService.getEnrolledCourses(
    {
      page: 1,
      size: 100,
    },
  );

  const courses = enrolledResponse.data ?? [];

  if (courses.length === 0) {
    return [];
  }

  const progressResponse =
    await LearningProgressControllerService.getCourseProgressByCourseIds({
      courseIds: courses
        .map((course) => String(course.id ?? ""))
        .filter(Boolean),
    });

  const progressMap = new Map<string, CourseProgressResponse>(
    (progressResponse.data ?? []).map((progress) => [
      String(progress.courseId ?? ""),
      progress,
    ]),
  );

  return courses.map((course) => mapCourse(course, progressMap));
};

export const fetchMyStreak = async (): Promise<MyStreakApi | null> => {
  const response = await StreakControllerService.getMyStreak();
  return response.data ?? null;
};

export const fetchMonthlyDailyGoals = async (
  year: number,
  month: number,
): Promise<MonthlyDailyGoalApi[]> => {
  const response = await DailyGoalControllerService.getDailyGoalsInMonth({
    year,
    month,
  });

  return response.data ?? [];
};

export const fetchDailyGoal = async (
  date?: string,
): Promise<MonthlyDailyGoalApi | null> => {
  const response = await DailyGoalControllerService.getDailyGoal({ date });
  return response.data ?? null;
};

export const createDailyGoal = async (
  requestBody: SetDailyGoalRequest,
): Promise<MonthlyDailyGoalApi | null> => {
  try {
    const response = await DailyGoalControllerService.setDailyGoal({
      requestBody,
    });

    return response.data ?? null;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }

    const refreshed = await refreshSession();

    if (!refreshed) {
      throw error;
    }

    const retryResponse = await DailyGoalControllerService.setDailyGoal({
      requestBody,
    });

    return retryResponse.data ?? null;
  }
};

const formatCertificateDate = (value: string | undefined): string => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("vi-VN");
};

const mapCertificateToCompleted = (
  certificate: CertificateApi,
): CompletedCourse => {
  const courseId = String(certificate.courseId ?? "").trim();
  const status = String(certificate.status ?? "PENDING").toUpperCase();

  return {
    id: String(certificate.id ?? courseId ?? Date.now()),
    title: courseId ? `Khóa học ${courseId}` : "Khóa học đã hoàn thành",
    completedDate: formatCertificateDate(
      certificate.approvedAt ?? certificate.requestedAt,
    ),
    statusLabel:
      status === "APPROVED"
        ? "Đã cấp chứng chỉ"
        : status === "REJECTED"
          ? "Bị từ chối"
          : "Đang chờ duyệt",
    imageUrl: "",
    certificateUrl: String(certificate.certificateUrl ?? ""),
  };
};

export const fetchMyCertificates = async (): Promise<CompletedCourse[]> => {
  const response = await CertificateControllerService.getMyCertificates();

  return (response.data ?? []).map(mapCertificateToCompleted);
};

export const toMonthlyGoalProgress = (
  year: number,
  month: number,
  goals: MonthlyDailyGoalApi[],
): MonthlyGoalProgress => {
  const totalGoals = goals.length;
  const completedGoals = goals.filter((goal) =>
    Boolean(goal.isCompleted),
  ).length;

  return {
    year,
    month,
    totalGoals,
    completedGoals,
    completionRate:
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    days: goals,
  };
};

export type {
  CompletedCourse,
  MonthlyGoalProgress,
  MyLearningCourse,
} from "../../types/myLearning";
