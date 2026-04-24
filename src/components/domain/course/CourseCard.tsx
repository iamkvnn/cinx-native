import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ReactElement, type ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type CourseCardVariant =
  | "default"
  | "glass"
  | "medium"
  | "compact"
  | "explore";

type CourseCardProps = {
  variant?: CourseCardVariant;
  title: string;
  imageUrl: string;
  onPress?: () => void;
  price?: number;
  priceLabel?: string;
  oldPriceLabel?: string;
  buttonLabel?: string;
  instructor?: string;
  subtitle?: string;
  description?: string;
  rating?: number | null;
  learnersLabel?: string;
  learners?: string;
  categoryLabel?: string;
  tag?: string;
  footerRight?: ReactNode;
};

export default function CourseCard({
  variant = "default",
  title,
  imageUrl,
  onPress,
  price,
  priceLabel,
  oldPriceLabel,
  buttonLabel = "Thêm",
  instructor,
  subtitle,
  description,
  rating,
  learnersLabel,
  learners,
  categoryLabel,
  tag,
  footerRight,
}: CourseCardProps): ReactElement {
  const normalizedVariant = variant === "explore" ? "compact" : variant;
  const displayInstructor =
    instructor ?? subtitle ?? description ?? "Giảng viên";
  const displayCategoryLabel = categoryLabel ?? tag ?? "Tổng hợp";
  const displayLearners = learnersLabel ?? learners ?? "0 học viên";
  const displayPriceLabel =
    priceLabel ??
    (typeof price === "number"
      ? `${price.toLocaleString("vi-VN")} đ`
      : "Miễn phí");
  const displayRating =
    typeof rating === "number" && Number.isFinite(rating)
      ? rating.toFixed(1)
      : "Chưa có";

  if (normalizedVariant === "default") {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100"
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: imageUrl }}
          className="h-44 w-full bg-gray-200"
          resizeMode="cover"
        />
        <View className="p-4 flex-1 justify-between">
          <View>
            <Text
              className="mb-2 text-[15px] font-bold text-slate-900"
              numberOfLines={2}
              style={{ minHeight: 42 }}
            >
              {title}
            </Text>
            <Text className="text-[11px] font-medium text-slate-500 mb-4" numberOfLines={1}>
              {displayInstructor}
            </Text>
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-slate-50">
            <View>
               {oldPriceLabel && (
                 <Text className="text-[10px] text-slate-400 line-through mb-0.5">{oldPriceLabel}</Text>
               )}
               <Text className="text-base font-black text-violet-600">
                {displayPriceLabel}
              </Text>
            </View>
            <View className="rounded-xl bg-violet-600 px-4 py-2">
              <Text className="text-xs font-bold text-white">
                {buttonLabel}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const isCompact = normalizedVariant === "compact";
  const isGlass = normalizedVariant === "glass";

  return (
    <Pressable
      style={[
        styles.glassPanel,
        isGlass ? styles.cardGlass : styles.cardMedium,
        isCompact ? styles.cardCompact : null,
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
          {displayCategoryLabel}
        </Text>
      </View>

      <View style={isCompact ? styles.bodyCompact : styles.bodyLarge}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{displayRating}</Text>
          <View style={styles.learnersRow}>
            <Ionicons name="people" size={12} color="#94a3b8" />
            <Text style={styles.learnersText} numberOfLines={1}>
              {displayLearners}
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
            {displayInstructor}
          </Text>
          {footerRight ?? (
            <View style={styles.priceWrap}>
              {oldPriceLabel ? (
                <Text style={styles.oldPriceText}>{oldPriceLabel}</Text>
              ) : null}
              <Text style={isCompact ? styles.priceCompact : styles.priceLarge}>
                {displayPriceLabel}
              </Text>
            </View>
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
  cardGlass: {
    width: 280,
    padding: 10,
  },
  cardMedium: {
    width: "100%",
    padding: 10,
  },
  cardCompact: {
    flex: 1,
    padding: 8,
    marginBottom: 0,
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
  priceWrap: {
    alignItems: "flex-end",
  },
  oldPriceText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  priceCompact: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "800",
  },
});
