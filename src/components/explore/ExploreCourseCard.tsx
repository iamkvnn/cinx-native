import { type ReactElement } from "react";

import CourseGlassCard from "../cards/CourseGlassCard";
import type { ExploreCourseItem } from "../../types/explore";

type ExploreCourseCardProps = {
  item: ExploreCourseItem;
  onPress?: () => void;
};

export default function ExploreCourseCard({
  item,
  onPress,
}: ExploreCourseCardProps): ReactElement {
  return (
    <CourseGlassCard
      size="compact"
      title={item.title}
      instructor={item.subtitle}
      rating={item.rating}
      learnersLabel={item.learnersLabel}
      priceLabel={item.priceLabel}
      imageUrl={item.imageUrl}
      categoryLabel={item.categoryLabel}
      onPress={onPress}
    />
  );
}
