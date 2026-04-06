import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/AppNavigator";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import Logo from "../../components/ui/Logo";
import {
  fetchBestSellers,
  fetchTopReviews,
  type BackendCourse,
  type BackendCourseReview,
} from "../../services/api/landingApi";

type Course = {
  id: number;
  title: string;
  instructor: string;
  rating: number;
  students: string;
  price: string;
  image: string;
  category: string;
};

type Testimonial = {
  id: number;
  text: string;
  user: string;
  avatar: string;
};

type Partner = {
  name: string;
  logoUrl: string;
};

const partners: Partner[] = [
  {
    name: "Google",
    logoUrl: "https://img.icons8.com/color/240/google-logo.png",
  },
  {
    name: "Microsoft",
    logoUrl: "https://img.icons8.com/color/240/microsoft.png",
  },
  {
    name: "Spotify",
    logoUrl: "https://img.icons8.com/color/240/spotify--v1.png",
  },
  {
    name: "Slack",
    logoUrl: "https://img.icons8.com/color/240/slack-new.png",
  },
  {
    name: "Airbnb",
    logoUrl: "https://img.icons8.com/color/240/airbnb.png",
  },
];

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80";

const formatPrice = (value: number | string | undefined): string => {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Miễn phí";
  }

  const thousands = numeric / 1000;

  if (Number.isInteger(thousands)) {
    return `${Math.round(thousands).toLocaleString("vi-VN")}k`;
  }

  return `${Number(thousands.toFixed(1)).toLocaleString("vi-VN")}k`;
};

const formatStudents = (value: number | undefined): string => {
  const count = Number(value ?? 0);

  if (!Number.isFinite(count) || count <= 0) {
    return "0";
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return String(count);
};

const toRandomRating = (): number => {
  return Math.round((4.5 + Math.random() * 0.5) * 10) / 10;
};

const mapCourseToUi = (course: BackendCourse): Course => {
  return {
    id: course.id,
    title: course.title ?? "Untitled course",
    instructor:
      course.instructor?.fullName ??
      course.instructor?.profile?.fullName ??
      "Unknown instructor",
    rating: toRandomRating(),
    students: formatStudents(course.enrollmentCount ?? course.enrollment_count),
    price: formatPrice(course.price),
    image: course.thumbnailUrl ?? course.thumbnail_url ?? FALLBACK_THUMBNAIL,
    category: course.category?.name ?? "General",
  };
};

const mapReviewToUi = (review: BackendCourseReview): Testimonial => {
  return {
    id: review.id,
    text: review.comment?.trim() || "Great learning experience!",
    user: review.user?.fullName || "Anonymous",
    avatar:
      review.user?.avatar ||
      `https://i.pravatar.cc/150?u=${review.user?.id ?? review.id}`,
  };
};

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}): ReactElement {
  return (
    <View style={[styles.glassPanel, style]}>
      <BlurView
        intensity={30}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
}

function PartnerMarquee(): ReactElement {
  const translateX = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    if (segmentWidth <= 0) {
      return;
    }

    translateX.setValue(0);

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -segmentWidth,
        duration: Math.max(12000, segmentWidth * 25),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [segmentWidth, translateX]);

  const handleMeasureGroup = (event: LayoutChangeEvent): void => {
    const width = event.nativeEvent.layout.width;

    if (width > 0 && Math.abs(width - segmentWidth) > 1) {
      setSegmentWidth(width);
    }
  };

  return (
    <View style={styles.partnerMarqueeViewport}>
      <Animated.View
        style={[styles.partnerMarqueeTrack, { transform: [{ translateX }] }]}
      >
        <View style={styles.partnerMarqueeGroup} onLayout={handleMeasureGroup}>
          {partners.map((partner, index) => (
            <View
              key={`p1-${partner.name}-${index}`}
              style={styles.partnerLogoWrap}
            >
              <Image
                source={{ uri: partner.logoUrl }}
                style={styles.partnerLogo}
                resizeMode="contain"
              />
            </View>
          ))}
        </View>

        <View style={styles.partnerMarqueeGroup}>
          {partners.map((partner, index) => (
            <View
              key={`p2-${partner.name}-${index}`}
              style={styles.partnerLogoWrap}
            >
              <Image
                source={{ uri: partner.logoUrl }}
                style={styles.partnerLogo}
                resizeMode="contain"
              />
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function ReviewMarquee({ items }: { items: Testimonial[] }): ReactElement {
  const topItems = items.filter((_, index) => index % 2 === 0);
  const bottomItems = items.filter((_, index) => index % 2 === 1);

  const fallbackItems = items.length > 0 ? items : [];

  const topLineItems = topItems.length > 0 ? topItems : fallbackItems;
  const bottomLineItems = bottomItems.length > 0 ? bottomItems : fallbackItems;

  return (
    <View style={styles.reviewRowsContainer}>
      <ReviewMarqueeLine items={topLineItems} initialOffsetRatio={0} />
      <ReviewMarqueeLine items={bottomLineItems} initialOffsetRatio={0.8} />
    </View>
  );
}

function ReviewMarqueeLine({
  items,
  initialOffsetRatio,
}: {
  items: Testimonial[];
  initialOffsetRatio: number;
}): ReactElement {
  const translateX = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);

  useEffect(() => {
    if (segmentWidth <= 0) {
      return;
    }

    const startX = -segmentWidth * initialOffsetRatio;
    const endX = startX - segmentWidth;

    translateX.setValue(startX);

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: endX,
        duration: Math.max(14000, segmentWidth * 24),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [initialOffsetRatio, segmentWidth, translateX]);

  const handleMeasureGroup = (event: LayoutChangeEvent): void => {
    const width = event.nativeEvent.layout.width;

    if (width > 0 && Math.abs(width - segmentWidth) > 1) {
      setSegmentWidth(width);
    }
  };

  const renderGroup = (groupKey: "g1" | "g2"): ReactElement => (
    <View
      style={styles.reviewMarqueeGroup}
      onLayout={groupKey === "g1" ? handleMeasureGroup : undefined}
    >
      {items.map((item, index) => (
        <View
          key={`${groupKey}-${item.id}-${index}`}
          style={styles.reviewMarqueeItem}
        >
          <GlassCard style={styles.testimonialCard}>
            <View style={styles.testimonialTopRow}>
              <Image
                source={{ uri: item.avatar }}
                style={styles.testimonialAvatar}
              />
              <View>
                <Text style={styles.testimonialName}>{item.user}</Text>
                <View style={styles.starRow}>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Ionicons
                      key={`${groupKey}-${item.id}-star-${starIndex}`}
                      name="star"
                      size={10}
                      color="#f59e0b"
                    />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.testimonialText}>"{item.text}"</Text>
          </GlassCard>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.reviewMarqueeViewport}>
      <Animated.View
        style={[styles.reviewMarqueeTrack, { transform: [{ translateX }] }]}
      >
        {renderGroup("g1")}
        {renderGroup("g2")}
      </Animated.View>
    </View>
  );
}

export default function LandingPage(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadLandingData = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const bestSellers = await fetchBestSellers();
        const mappedCourses = bestSellers.map(mapCourseToUi);

        if (!active) {
          return;
        }

        setCourses(mappedCourses);

        const firstCourseId = bestSellers[0]?.id;

        if (!firstCourseId) {
          setTestimonials([]);
          return;
        }

        const topReviews = await fetchTopReviews(firstCourseId);

        if (!active) {
          return;
        }

        setTestimonials(topReviews.map(mapReviewToUi));
      } catch (_error) {
        if (active) {
          setError("Khong the tai du lieu trang chu. Vui long thu lai sau.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadLandingData();

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <AppScreenBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Dang tai du lieu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <AppScreenBackground />

      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <Logo />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroTitle}>
          Học tập{"\n"}
          <Text style={styles.heroTitleGradient}>Không giới hạn</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          Trải nghiệm nền tang học tập trực tuyến đột phá với hàng ngàn khóa học
          chất lượng cao.
        </Text>

        <View style={styles.heroButtons}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryButtonText}>Bắt đầu ngay</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </Pressable>
        </View>

        <View style={styles.partnerRail}>
          <PartnerMarquee />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Khóa học phổ biến</Text>
            <Text style={styles.sectionCaption}>Xu hướng học tập mới nhất</Text>
          </View>
          <Pressable style={styles.sectionAction}>
            <Text style={styles.sectionActionText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={14} color="#7c3aed" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseList}
        >
          {courses.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có khóa học nổi bật.</Text>
          ) : null}
          {courses.map((course) => (
            <Pressable
              key={course.id}
              onPress={() =>
                navigation.navigate("CourseDetail", {
                  courseId: String(course.id),
                })
              }
            >
              <GlassCard style={styles.courseCard}>
                <View style={styles.courseImageWrap}>
                  <Image
                    source={{ uri: course.image }}
                    style={styles.courseImage}
                  />
                  <Text style={styles.categoryBadge}>{course.category}</Text>
                </View>

                <View style={styles.courseBody}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.ratingText}>{course.rating}</Text>
                    <Text style={styles.studentsText}>({course.students})</Text>
                  </View>

                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>

                  <View style={styles.courseFooter}>
                    <Text style={styles.instructorText} numberOfLines={1}>
                      {course.instructor}
                    </Text>
                    <Text style={styles.priceText}>{course.price}</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.testimonialHeader}>
          <Text style={styles.sectionTitle}>Đánh giá từ học viên</Text>
          <Text style={styles.sectionCaption}>Cộng đồng học tập tích cực</Text>
        </View>

        {testimonials.length === 0 ? (
          <Text style={styles.emptyText}>
            Chưa có đánh giá cho khóa học này.
          </Text>
        ) : (
          <ReviewMarquee items={testimonials} />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#475569",
    fontWeight: "600",
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blobA: {
    position: "absolute",
    width: 320,
    height: 280,
    borderRadius: 180,
    top: -70,
    left: -60,
  },
  blobB: {
    position: "absolute",
    width: 320,
    height: 300,
    borderRadius: 190,
    top: 120,
    right: -90,
  },
  blobC: {
    position: "absolute",
    width: 300,
    height: 260,
    borderRadius: 180,
    bottom: 90,
    left: 20,
  },
  header: {
    paddingHorizontal: 0,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  brandAccent: {
    color: "#7c3aed",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  heroTag: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 18,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#8b5cf6",
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    textAlign: "center",
    fontSize: 42,
    fontFamily: "Georgia, serif",
    lineHeight: 50,
    fontWeight: "700",
    color: "#0f172a",
  },
  heroTitleGradient: {
    color: "#8b5cf6",
    fontFamily: "Georgia, serif",
  },
  heroSubtitle: {
    marginTop: 14,
    textAlign: "center",
    color: "#64748b",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  heroButtons: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryButtonText: {
    color: "#1e293b",
    fontWeight: "700",
  },
  partnerRail: {
    marginTop: 24,
    marginHorizontal: -16,
    backgroundColor: "rgba(255,255,255,0.0)",
    paddingVertical: 12,
    overflow: "hidden",
  },
  partnerMarqueeViewport: {
    overflow: "hidden",
    flexDirection: "row",
  },
  partnerMarqueeTrack: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerMarqueeGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerLogoWrap: {
    width: 126,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  partnerLogo: {
    width: 142,
    height: 46,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionCaption: {
    marginTop: 2,
    color: "#64748b",
    fontWeight: "500",
    fontSize: 13,
  },
  sectionAction: {
    borderRadius: 999,
    backgroundColor: "rgba(245,243,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sectionActionText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 12,
  },
  courseList: {
    gap: 12,
    paddingRight: 12,
  },
  glassPanel: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  courseCard: {
    width: 280,
    padding: 10,
  },
  courseImageWrap: {
    position: "relative",
    height: 162,
    borderRadius: 18,
    overflow: "hidden",
  },
  courseImage: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "700",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  courseBody: {
    marginTop: 12,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 13,
  },
  studentsText: {
    color: "#94a3b8",
    fontSize: 12,
  },
  courseTitle: {
    marginTop: 8,
    color: "#0f172a",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },
  courseFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(226,232,240,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  instructorText: {
    flex: 1,
    marginRight: 8,
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
  },
  priceText: {
    color: "#7c3aed",
    fontSize: 20,
    fontWeight: "900",
  },
  testimonialHeader: {
    marginTop: 26,
    marginBottom: 12,
    alignItems: "center",
  },
  testimonialList: {
    gap: 12,
    paddingRight: 14,
  },
  reviewRowsContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    gap: 10,
  },
  reviewMarqueeViewport: {
    height: 136,
    overflow: "hidden",
  },
  reviewMarqueeTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reviewMarqueeGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reviewMarqueeItem: {
    marginRight: 12,
  },
  testimonialCard: {
    width: 272,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  testimonialTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  testimonialName: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  testimonialText: {
    color: "#475569",
    lineHeight: 19,
    fontSize: 13,
    fontWeight: "500",
  },
  emptyText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  errorText: {
    marginTop: 12,
    color: "#dc2626",
    textAlign: "center",
    fontWeight: "600",
  },
  bottomSpace: {
    height: 72,
  },
});
