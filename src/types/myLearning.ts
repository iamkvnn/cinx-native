import type { DailyGoalResponse } from "@/types";

export type DailyGoalType = "quiz" | "video" | "code" | "add" | "rest";

export type DailyGoal = {
  id: string;
  text: string;
  done: boolean;
  time: string;
  type: DailyGoalType;
};

export type DailyGoalsData = {
  day: number;
  month: number;
  year: number;
  goals: DailyGoal[];
};

export type StreakRange = {
  start: number;
  end: number;
};

export type CalendarData = {
  month: number;
  year: number;
  currentDay: number;
  streakRanges: StreakRange[];
  daysWithEvents: number[];
};

export type MyLearningData = {
  calendar: CalendarData;
  streakStats: {
    currentStreak: number;
    totalXP: number;
  };
  userAvatar?: string;
};

export type MonthlyGoalProgress = {
  year: number;
  month: number;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  days: DailyGoalResponse[];
};

export type MyLearningCourse = {
  id: string;
  title: string;
  nextLesson: string;
  progress: number;
  imageUrl: string;
  color: "violet" | "pink" | "indigo" | "emerald" | "amber";
};

export type CompletedCourse = {
  id: string;
  title: string;
  completedDate: string;
  statusLabel?: string;
  imageUrl: string;
  certificateUrl?: string;
  grade?: string;
};

export type MyLearningCoursesData = {
  inProgress: MyLearningCourse[];
  completed: CompletedCourse[];
};
