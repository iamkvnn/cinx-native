import type { CalendarData, MyLearningData } from "../types/myLearning";

export const mockCalendarData: CalendarData = {
  month: 5, // May
  year: 2026,
  currentDay: 24,
  streakRanges: [
    { start: 10, end: 14 },
    { start: 20, end: 22 },
  ],
  daysWithEvents: [5, 10, 12, 14, 20, 22, 24],
};

export const mockMyLearningData: MyLearningData = {
  calendar: mockCalendarData,
  streakStats: {
    currentStreak: 12,
    totalXP: 2450,
  },
  userAvatar: "https://i.pravatar.cc/150?u=8",
};
