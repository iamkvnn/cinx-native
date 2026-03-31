import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type CourseGlassCardSize = "large" | "compact";

type CourseGlassCardProps = {
  title: string;
  instructor: string;
  rating: number;
  learnersLabel: string;
  priceLabel: string;
  imageUrl: string;
  categoryLabel: string;
  size?: CourseGlassCardSize;
  onPress?: () => void;
  footerRight?: ReactNode;
};

export default function CourseMedCard({
  title,
  instructor,
  rating,
  learnersLabel,
  priceLabel,
  imageUrl,
  categoryLabel,
  size = "large",
  onPress,
  footerRight,
}: CourseGlassCardProps): ReactElement {
  const isCompact = size === "compact";

  return (
    <Pressable
      style={[
        styles.glassPanel,
        isCompact ? styles.cardCompact : styles.cardLarge,
      ]}
      className={isCompact ? "mb-4" : ""}
      onPress={onPress}
    >
      <BlurView
        intensity={30}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />

      <View style={isCompact ? styles.imageWrapCompact : styles.imageWrapLarge}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.categoryBadge} numberOfLines={1}>
          {categoryLabel}
        </Text>
      </View>

      <View style={isCompact ? styles.bodyCompact : styles.bodyLarge}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{rating}</Text>
          <View style={styles.learnersRow}>
            <Ionicons name="people" size={12} color="#94a3b8" />
            <Text style={styles.learnersText} numberOfLines={1}>
              {learnersLabel}
            </Text>
          </View>
        </View>

        <Text
          style={isCompact ? styles.titleCompact : styles.titleLarge}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.instructorText} numberOfLines={1}>
            {instructor}
          </Text>
          {footerRight ?? (
            <Text style={isCompact ? styles.priceCompact : styles.priceLarge}>
              {priceLabel}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glassPanel: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  cardLarge: {
    width: "100%",
    padding: 10,
  },
  cardCompact: {
    flex: 1,
    padding: 8,
  },
  imageWrapLarge: {
    position: "relative",
    height: 162,
    borderRadius: 18,
    overflow: "hidden",
  },
  imageWrapCompact: {
    position: "relative",
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    color: "#0f172a",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: "hidden",
    maxWidth: "86%",
  },
  bodyLarge: {
    marginTop: 12,
    paddingHorizontal: 6,
    paddingBottom: 4,
    flex: 1,
  },
  bodyCompact: {
    marginTop: 9,
    paddingHorizontal: 3,
    paddingBottom: 2,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  learnersRow: {
    marginLeft: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
  },
  ratingText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 12,
  },
  learnersText: {
    color: "#94a3b8",
    fontSize: 11,
    flexShrink: 1,
  },
  titleLarge: {
    marginTop: 8,
    color: "#0f172a",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    minHeight: 46,
  },
  titleCompact: {
    marginTop: 7,
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    minHeight: 38,
  },
  footerRow: {
    marginTop: "auto",
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
    fontSize: 10,
  },
  priceLarge: {
    color: "#7c3aed",
    fontSize: 20,
    fontWeight: "900",
  },
  priceCompact: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "800",
  },
});
