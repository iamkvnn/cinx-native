import type { ExploreData } from "../../types/explore";

export const mockExploreData: ExploreData = {
  categories: [
    { id: "all", name: "Tất cả" },
    { id: "programming", name: "Lập trình" },
    { id: "design", name: "Thiết kế" },
    { id: "business", name: "Kinh doanh" },
    { id: "marketing", name: "Marketing" },
    { id: "language", name: "Ngoại ngữ" },
  ],
  featuredCourse: {
    id: "featured-motion",
    title: "Mastering UI Motion",
    description:
      "Học cách tạo ra các chuyển động mượt mà, animation phức tạp với After Effects và Figma.",
    instructorName: "Alex Design",
    rating: 5,
    learnersLabel: "1.2k learners",
    priceLabel: "$89.00",
    tagLabel: "Best Seller",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop",
  },
  newestCourses: [
    {
      id: "python-data-science",
      title: "Python Data Science Pro",
      subtitle: "Build 5 real-world projects",
      categoryId: "programming",
      categoryLabel: "Code",
      durationLabel: "22h",
      rating: 4.8,
      learnersLabel: "1.2k learners",
      priceLabel: "$49",
      imageUrl:
        "https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: "instagram-growth",
      title: "Instagram Growth 2026",
      subtitle: "Strategies for influencers",
      categoryId: "marketing",
      categoryLabel: "Marketing",
      durationLabel: "5h",
      rating: 4.6,
      learnersLabel: "1.2k learners",
      priceLabel: "$29",
      imageUrl:
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: "startup-101",
      title: "Startup 101 Guide",
      subtitle: "From idea to launch",
      categoryId: "business",
      categoryLabel: "Business",
      durationLabel: "2h",
      rating: 4.9,
      learnersLabel: "1.2k learners",
      priceLabel: "Free",
      imageUrl:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=300&auto=format&fit=crop",
    },
    {
      id: "figma-foundation",
      title: "Figma Foundation",
      subtitle: "Design workflow and system",
      categoryId: "design",
      categoryLabel: "Thiết kế",
      durationLabel: "8h",
      rating: 4.7,
      learnersLabel: "1.2k learners",
      priceLabel: "$35",
      imageUrl:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=300&auto=format&fit=crop",
    },
  ],
};
