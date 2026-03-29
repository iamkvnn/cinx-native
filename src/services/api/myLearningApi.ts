import { mockMyLearningData } from "../mocks/mockMyLearningCalendar";
import { mockDailyGoals, mockDefaultGoals } from "../mocks/mockDailyGoals";
import { mockMyLearningCourses } from "../mocks/mockMyLearningCourses";
import type {
  DailyGoalsData,
  MyLearningCoursesData,
  MyLearningData,
} from "../../types/myLearning";

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
