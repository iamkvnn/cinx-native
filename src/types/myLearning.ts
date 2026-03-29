// MyLearning screen type definitions
export interface StreakRange {
  start: number;
  end: number;
}

export interface DailyGoal {
  id: string;
  text: string;
  done: boolean;
  time: string; // "30m", "45m", "--", "+"
  type: "quiz" | "video" | "code" | "add" | "rest";
}

export interface MyLearningCourse {
  id: string;
  title: string;
  progress: number; // 0-100
  nextLesson: string;
  imageUrl: string;
  color: "violet" | "pink" | "indigo" | "emerald" | "amber";
}

export interface CompletedCourse {
  id: string;
  title: string;
  grade: string; // "98/100"
  completedDate: string; // "12/04/2026"
  imageUrl: string;
}

export interface CalendarData {
  month: number; // 1-12
  year: number;
  currentDay: number;
  streakRanges: StreakRange[];
  daysWithEvents: number[];
}

export interface DailyGoalsData {
  day: number;
  month: number;
  year: number;
  goals: DailyGoal[];
}

export interface MyLearningCoursesData {
  inProgress: MyLearningCourse[];
  completed: CompletedCourse[];
}

export interface MyLearningData {
  calendar: CalendarData;
  streakStats: {
    currentStreak: number;
    totalXP: number;
  };
  userAvatar: string;
}
