import type { HomeDashboardData } from "../../types/home";

export const mockHomeDashboard: HomeDashboardData = {
  greeting: {
    name: "Thanh Độ",
    greetingLabel: "Chào buổi sáng,",
    avatarUrl: "https://i.pravatar.cc/150?u=my_user",
    streakDays: 12,
  },
  quote: {
    content:
      '"Học tập không phải là hạt giống của kiến thức, mà là hạt giống của hạnh phúc."',
    author: "Tục ngữ Zen",
  },
  continueLearning: [
    {
      id: "figma-auto-layout",
      title: "Figma: Advanced Auto Layout",
      chapter: "Chương 4: Components",
      remainingTime: "còn 30p",
      progressPercent: 75,
      iconName: "color-palette",
      gradientColors: ["#fb923c", "#ec4899"],
    },
    {
      id: "react-native-beginner",
      title: "React Native for Beginners",
      chapter: "Chương 2: Navigation",
      remainingTime: "còn 1h",
      progressPercent: 30,
      iconName: "logo-react",
      gradientColors: ["#60a5fa", "#22d3ee"],
    },
  ],
  goals: {
    achievedXp: 350,
    targetXp: 500,
    completedTasks: 1,
    totalTasks: 2,
    dailyTaskLabel: "Làm 1 Quiz",
  },
  recommendations: [
    {
      id: "ui-motion",
      tag: "Mới",
      title: "UI Motion Design Principles",
      description: "Vì bạn quan tâm đến Animation va Figma.",
      imageUrl:
        "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=300&auto=format&fit=crop",
      rating: 4.9,
      learners: "1.2k",
    },
    {
      id: "clean-code-java",
      tag: "Hot",
      title: "Clean Code in Java",
      description: "Phù hợp với lộ trình Android Dev của bạn.",
      imageUrl:
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=300&auto=format&fit=crop",
      rating: 4.7,
      learners: "850",
    },
  ],
};
