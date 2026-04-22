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
  learnersLabel: string;
  priceLabel: string;
  oldPriceLabel?: string;
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
  learnersLabel: string;
  priceLabel: string;
  oldPriceLabel?: string;
  imageUrl: string;
}

export interface ExploreData {
  categories: ExploreCategory[];
  featuredCourse: ExploreFeaturedCourse;
  newestCourses: ExploreCourseItem[];
}
