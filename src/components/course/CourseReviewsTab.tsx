import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import type { CreateReviewRequest, ReviewResponse, UserDto } from "@/types";
import { ReviewControllerService } from "../../services/api/ReviewControllerService";
import { UserControllerService } from "../../services/api/UserControllerService";
import { useAuthStore } from "../../store/useAuthStore";
import type { AuthUser } from "../../types/auth";

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?u=review";

type CourseReviewsTabProps = {
  courseId: string;
  isPurchased: boolean;
  reviews: Array<ReviewResponse & { createdAt?: string }>;
};

const mapUser = (user: UserDto | null | undefined): AuthUser | null => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.userId,
    fullName: user.name,
    avatar: user.avatarUrl,
    rewardPoints: user.xp,
    profile: {
      fullName: user.name,
      email: user.email,
      avatar: user.avatarUrl,
    },
  };
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const formatRelativeTime = (value?: string): string => {
  if (!value) {
    return "Vừa xong";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Vừa xong";
  }

  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} phút trước`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} giờ trước`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} ngày trước`;
};

export default function CourseReviewsTab({
  courseId,
  isPurchased,
  reviews,
}: CourseReviewsTabProps): ReactElement {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasReviewed = useMemo(() => {
    const currentUserId = String(currentUser?.id ?? "");

    if (!currentUserId) {
      return false;
    }

    return reviews.some(
      (review) => String(review.userId ?? "") === currentUserId,
    );
  }, [currentUser?.id, reviews]);

  const summary = useMemo(() => {
    const total = reviews.length;
    const average =
      total > 0
        ? reviews.reduce((acc, review) => acc + Number(review.rating ?? 0), 0) /
          total
        : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) => Number(review.rating ?? 0) === star,
      ).length;

      return {
        star,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    return {
      total,
      average,
      distribution,
    };
  }, [reviews]);

  const canShowReviewForm = isPurchased && !hasReviewed;

  const handleSubmitReview = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    const normalizedComment = comment.trim();

    if (!normalizedComment) {
      Alert.alert(
        "Thiếu nội dung",
        "Vui lòng nhập nhận xét của bạn trước khi gửi.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await ReviewControllerService.createReview({
        requestBody: {
          courseId,
          rating,
          content: normalizedComment,
        } satisfies CreateReviewRequest,
      });

      Alert.alert(
        "Thành công",
        "Cảm ơn bạn! Bạn đã được cộng 100 điểm thưởng.",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-detail", "reviews", Number(courseId)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-detail", "reviews", courseId],
        }),
      ]);

      try {
        const response = await UserControllerService.getCurrentUser();
        useAuthStore.getState().setUser(mapUser(response.data ?? null));
      } catch {
        // Keep UI flow smooth even if profile refresh fails.
      }

      setRating(5);
      setComment("");
    } catch (error) {
      Alert.alert(
        "Không thể gửi đánh giá",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="mt-4 gap-4">
      <View className="flex-row items-center rounded-3xl border border-white/70 bg-white/65 p-5">
        <View className="items-center pr-4">
          <Text className="text-4xl font-black text-slate-800">
            {summary.average > 0 ? summary.average.toFixed(1) : "0.0"}
          </Text>
          <View className="my-1 flex-row gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={12}
                color={i < Math.round(summary.average) ? "#f59e0b" : "#cbd5e1"}
              />
            ))}
          </View>
          <Text className="text-[10px] font-bold text-slate-500">
            {summary.total.toLocaleString("vi-VN")} đánh giá
          </Text>
        </View>
        <View className="flex-1 gap-1">
          {summary.distribution.map((r) => (
            <View key={r.star} className="flex-row items-center gap-2">
              <Text className="w-2 text-[10px] font-bold text-slate-500">
                {r.star}
              </Text>
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <View
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${r.percent}%` }}
                />
              </View>
              <Text className="w-7 text-right text-[10px] font-bold text-slate-500">
                {r.percent}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {canShowReviewForm ? (
        <View className="rounded-3xl border border-white/70 bg-white/60 p-4">
          <Text className="text-sm font-bold text-slate-800">
            Để lại đánh giá của bạn (Nhận ngay 100 điểm thưởng!)
          </Text>

          <View className="mt-3 flex-row items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;

              return (
                <Pressable
                  key={starValue}
                  className="h-9 w-9 items-center justify-center"
                  hitSlop={8}
                  onPress={() => setRating(starValue)}
                >
                  <Ionicons
                    name="star"
                    size={26}
                    color={starValue <= rating ? "#f59e0b" : "#cbd5e1"}
                  />
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
            placeholder="Chia sẻ trải nghiệm của bạn về khóa học..."
            className="mt-3 min-h-[96px] rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700"
          />

          <Pressable
            className="mt-3 h-11 items-center justify-center rounded-2xl bg-violet-600"
            onPress={() => void handleSubmitReview()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-sm font-bold text-white">Gửi đánh giá</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {reviews.length === 0 ? (
        <View className="rounded-3xl border border-white/70 bg-white/65 p-4">
          <Text className="text-center text-sm font-medium text-slate-500">
            Chưa có đánh giá nào cho khóa học này.
          </Text>
        </View>
      ) : null}

      {reviews.map((review) => (
        <View
          key={review.id}
          className="rounded-3xl border border-white/70 bg-white/65 p-4"
        >
          <View className="mb-2 flex-row items-start justify-between">
            <View className="flex-row items-center gap-2">
              <Image
                source={{
                  uri:
                    (String(review.userId ?? "") ===
                    String(currentUser?.id ?? "")
                      ? currentUser?.avatar
                      : undefined) ??
                    `${FALLBACK_AVATAR}&id=${String(review.userId ?? review.id ?? "review")}`,
                }}
                className="h-8 w-8 rounded-full"
              />
              <View>
                <Text className="text-sm font-bold text-slate-800">
                  {String(review.userId ?? "") === String(currentUser?.id ?? "")
                    ? (currentUser?.fullName ?? "Bạn")
                    : "Học viên"}
                </Text>
                <Text className="text-[10px] text-slate-500">
                  {formatRelativeTime(review.createdAt)}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={12}
                  color={i < Number(review.rating ?? 0) ? "#f59e0b" : "#cbd5e1"}
                />
              ))}
            </View>
          </View>

          <Text className="text-sm font-medium leading-6 text-slate-600">
            {review.content ?? ""}
          </Text>
        </View>
      ))}
    </View>
  );
}
