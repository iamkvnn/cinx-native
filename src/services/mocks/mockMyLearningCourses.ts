import type { MyLearningCoursesData } from "../types/myLearning";

export const mockMyLearningCourses: MyLearningCoursesData = {
  inProgress: [
    {
      id: "course-1",
      title: "Advanced React Patterns",
      progress: 75,
      nextLesson: "Custom Hooks Deep Dive",
      imageUrl:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&q=80",
      color: "violet",
    },
    {
      id: "course-2",
      title: "UI Design Fundamentals",
      progress: 30,
      nextLesson: "Color Theory & Emotion",
      imageUrl:
        "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=300&q=80",
      color: "pink",
    },
    {
      id: "course-3",
      title: "Business English B2",
      progress: 50,
      nextLesson: "Negotiation Skills",
      imageUrl:
        "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=300&q=80",
      color: "indigo",
    },
  ],
  completed: [
    {
      id: "course-completed-1",
      title: "HTML & CSS Basics",
      grade: "98/100",
      completedDate: "12/04/2026",
      imageUrl:
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80",
    },
    {
      id: "course-completed-2",
      title: "Intro to Python",
      grade: "95/100",
      completedDate: "05/03/2026",
      imageUrl:
        "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&q=80",
    },
  ],
};
