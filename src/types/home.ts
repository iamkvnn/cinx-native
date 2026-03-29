export interface GreetingInfo {
  name: string;
  greetingLabel: string;
  avatarUrl: string;
  streakDays: number;
}

export interface MotivationQuote {
  content: string;
  author: string;
}

export interface ContinueLearningItem {
  id: string;
  title: string;
  chapter: string;
  remainingTime: string;
  progressPercent: number;
  iconName: "color-palette" | "logo-react";
  gradientColors: [string, string];
}

export interface GoalProgress {
  achievedXp: number;
  targetXp: number;
  completedTasks: number;
  totalTasks: number;
  dailyTaskLabel: string;
}

export interface RecommendationItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  learners: string;
}

export interface HomeDashboardData {
  greeting: GreetingInfo;
  quote: MotivationQuote;
  continueLearning: ContinueLearningItem[];
  goals: GoalProgress;
  recommendations: RecommendationItem[];
}
