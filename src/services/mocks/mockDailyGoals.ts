import type { DailyGoalsData } from "../../types/myLearning";

export const mockDailyGoals: Record<number, DailyGoalsData> = {
  24: {
    day: 24,
    month: 5,
    year: 2026,
    goals: [
      {
        id: "1",
        text: "Hoàn thành Quiz Module 3",
        done: true,
        time: "30m",
        type: "quiz",
      },
      {
        id: "2",
        text: "Xem video 'React Hooks'",
        done: true,
        time: "45m",
        type: "video",
      },
      {
        id: "3",
        text: "Bài tập thực hành UI",
        done: false,
        time: "60m",
        type: "code",
      },
    ],
  },
  5: {
    day: 5,
    month: 5,
    year: 2026,
    goals: [
      {
        id: "1",
        text: "Review TypeScript Basics",
        done: true,
        time: "40m",
        type: "video",
      },
      {
        id: "2",
        text: "Practice Quiz - Interfaces",
        done: false,
        time: "25m",
        type: "quiz",
      },
    ],
  },
};

export const mockDefaultGoals: DailyGoalsData = {
  day: 1,
  month: 5,
  year: 2026,
  goals: [
    {
      id: "1",
      text: "Nghỉ ngơi hoặc ôn tập nhẹ",
      done: false,
      time: "--",
      type: "rest",
    },
    {
      id: "2",
      text: "Thêm mục tiêu mới?",
      done: false,
      time: "+",
      type: "add",
    },
  ],
};
