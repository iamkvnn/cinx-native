import type {
  LandingCourse,
  LandingPageData,
  LandingPartner,
  LandingTestimonial,
} from "../../types/landing";

export const mockLandingPartners: LandingPartner[] = [
  {
    id: "partner-google",
    name: "Google",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    id: "partner-microsoft",
    name: "Microsoft",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg",
  },
  {
    id: "partner-spotify",
    name: "Spotify",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg",
  },
  {
    id: "partner-slack",
    name: "Slack",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  },
  {
    id: "partner-airbnb",
    name: "Airbnb",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg",
  },
  {
    id: "partner-uber",
    name: "Uber",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
  },
];

export const mockLandingCourses: LandingCourse[] = [
  {
    id: "landing-course-1",
    title: "UI/UX Design Masterclass",
    instructor: "Ha Linh",
    rating: 4.9,
    students: "12k",
    price: "599k",
    image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&q=80",
    category: "Design",
  },
  {
    id: "landing-course-2",
    title: "Fullstack React and Node.js",
    instructor: "Minh Tuan",
    rating: 4.8,
    students: "8.5k",
    price: "899k",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    category: "Coding",
  },
  {
    id: "landing-course-3",
    title: "Digital Marketing 101",
    instructor: "Sarah Nguyen",
    rating: 4.7,
    students: "15k",
    price: "450k",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80",
    category: "Business",
  },
  {
    id: "landing-course-4",
    title: "Nhiep anh duong pho",
    instructor: "Quang Hai",
    rating: 4.9,
    students: "5k",
    price: "399k",
    image: "https://images.unsplash.com/photo-1554048612-387768052bf7?w=800&q=80",
    category: "Art",
  },
];

export const mockLandingTestimonials: LandingTestimonial[] = [
  {
    id: "testimonial-1",
    text: "Khoa hoc thay doi tu duy cua toi!",
    user: "An Nhien",
    avatar: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: "testimonial-2",
    text: "Giao dien app qua dep va muot.",
    user: "Bao Long",
    avatar: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: "testimonial-3",
    text: "Kien thuc thuc te, ap dung ngay.",
    user: "Huong Giang",
    avatar: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: "testimonial-4",
    text: "Support nhiet tinh 24/7.",
    user: "Duc Minh",
    avatar: "https://i.pravatar.cc/150?u=4",
  },
  {
    id: "testimonial-5",
    text: "Gia ca hop ly cho sinh vien.",
    user: "Thao Vy",
    avatar: "https://i.pravatar.cc/150?u=5",
  },
  {
    id: "testimonial-6",
    text: "Cong dong hoc tap rat soi noi.",
    user: "Tuan Kiet",
    avatar: "https://i.pravatar.cc/150?u=6",
  },
];

export const mockLandingPageData: LandingPageData = {
  partners: mockLandingPartners,
  popularCourses: mockLandingCourses,
  testimonials: mockLandingTestimonials,
};
