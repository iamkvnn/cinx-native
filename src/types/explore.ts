export interface ExploreCategory {
  id: string;
  name: string;
}

export interface ExploreFeaturedCourse {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  rating: number;
  priceLabel: string;
  tagLabel: string;
  imageUrl: string;
}

export interface ExploreCourseItem {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  categoryLabel: string;
  durationLabel: string;
  rating: number;
  priceLabel: string;
  imageUrl: string;
}

export interface ExploreData {
  categories: ExploreCategory[];
  featuredCourse: ExploreFeaturedCourse;
  newestCourses: ExploreCourseItem[];
}
