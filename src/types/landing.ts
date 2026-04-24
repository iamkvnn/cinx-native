export interface LandingPartner {
  id: string;
  name: string;
  logo: string;
}

export interface LandingCourse {
  id: string;
  title: string;
  instructor: string;
  rating: number;
  students: string;
  price: string;
  image: string;
  category: string;
}

export interface LandingTestimonial {
  id: string;
  text: string;
  user: string;
  avatar: string;
}

export interface LandingPageData {
  partners: LandingPartner[];
  popularCourses: LandingCourse[];
  testimonials: LandingTestimonial[];
}
