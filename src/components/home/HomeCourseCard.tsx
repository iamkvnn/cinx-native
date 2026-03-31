import { type ReactElement } from "react";

import CourseMedCard from "../cards/CourseMedCard";

export type HomeCourseCardItem = {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  learners: string;
  priceLabel: string;
};

type HomeCourseCardProps = {
  item: HomeCourseCardItem;
  onPress?: () => void;
};

export default function HomeCourseCard({
  item,
  onPress,
}: HomeCourseCardProps): ReactElement {
  return (
    <CourseMedCard
      size="large"
      title={item.title}
      instructor={item.description}
      rating={item.rating}
      learnersLabel={item.learners}
      priceLabel={item.priceLabel}
      imageUrl={item.imageUrl}
      categoryLabel={item.tag}
      onPress={onPress}
    />
  );
}
