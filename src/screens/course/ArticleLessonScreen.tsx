import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import {
  type ReactElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import RenderHtml from "react-native-render-html";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CourseDetailResponse } from "@/types";
import LessonDrawer from "../../components/course/LessonDrawer";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { ArticleLessonControllerService } from "../../services/api/ArticleLessonControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import {
  extractCompletedLessonIds,
  findPreviousLesson,
  findNextLesson,
  getLessonRouteName,
  type LessonRouteName,
} from "../../utils/lessonFlow";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type ArticleLessonScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ArticleLesson"
>;

export default function ArticleLessonScreen({
  route,
}: ArticleLessonScreenProps): ReactElement {
  const { width } = useWindowDimensions();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const courseId = String(route.params?.courseId ?? "").trim();
  const hasCourseId = courseId.length > 0;
  const lessonId = String(route.params?.lessonId ?? "").trim();
  const lessonTitle = route.params?.lessonTitle ?? "Bài nội dung";

  const courseQuery = useQuery<CourseDetailResponse | null>({
    queryKey: ["lesson-course", courseId],
    queryFn: async () => {
      const response = await CourseControllerService.getCourseById({
        id: courseId,
      });

      return response.data ?? null;
    },
    enabled: hasCourseId,
  });

  const itemProgressQuery = useQuery({
    queryKey: ["course-detail", "item-progress", courseId],
    queryFn: () =>
      LearningProgressControllerService.getLearningItemProgressByCourseId({
        courseId,
      }),
    enabled: hasCourseId,
    retry: false,
  });

  const completedLessonIds = extractCompletedLessonIds(
    itemProgressQuery.data?.data,
  );
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
  const completedOnceRef = useRef(false);

  const nextLesson = useMemo(() => {
    return findNextLesson(courseQuery.data, lessonId);
  }, [courseQuery.data, lessonId]);

  const previousLesson = useMemo(() => {
    return findPreviousLesson(courseQuery.data, lessonId);
  }, [courseQuery.data, lessonId]);

  const nextLessonRoute = getLessonRouteName(nextLesson?.lessonType);
  const previousLessonRoute = getLessonRouteName(previousLesson?.lessonType);

  const goToCourseCurriculum = (): void => {
    if (!hasCourseId) {
      return;
    }

    navigation.replace("CourseDetail", {
      courseId,
      initialTab: "curriculum",
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          className="mr-1 h-9 w-9 items-center justify-center"
          onPress={() => setIsLessonDrawerOpen((previous) => !previous)}
        >
          <Ionicons name="menu-outline" size={20} color="#334155" />
        </Pressable>
      ),
    });
  }, [navigation]);

  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      await LearningProgressControllerService.markItemAsComplete({
        itemId: lessonId,
      });
    },
    onSuccess: async () => {
      setIsLessonCompleted(true);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-detail", "item-progress", courseId],
        }),
        queryClient.invalidateQueries({ queryKey: ["course-detail"] }),
      ]);
    },
  });

  useEffect(() => {
    setIsLessonCompleted(completedLessonIds.includes(lessonId));
  }, [completedLessonIds, lessonId]);

  const handleNextLesson = (): void => {
    if (!nextLesson || !nextLessonRoute) {
      return;
    }

    const nextLessonId = String(nextLesson.id ?? "").trim();
    if (!nextLessonId) {
      return;
    }

    const nextLessonTitle = nextLesson.title ?? "Bài học";

    switch (nextLessonRoute) {
      case "VideoLesson":
        navigation.replace("VideoLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
      case "ArticleLesson":
        navigation.replace("ArticleLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
      case "QuizLesson":
        navigation.replace("QuizLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
      case "AssignmentLesson":
        navigation.replace("AssignmentLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
    }
  };

  const handlePreviousLesson = (): void => {
    if (!previousLesson || !previousLessonRoute) {
      return;
    }

    const previousLessonId = String(previousLesson.id ?? "").trim();
    if (!previousLessonId) {
      return;
    }

    const previousLessonTitle = previousLesson.title ?? "Bài học";

    switch (previousLessonRoute) {
      case "VideoLesson":
        navigation.replace("VideoLesson", {
          lessonId: previousLessonId,
          courseId,
          lessonTitle: previousLessonTitle,
        });
        break;
      case "ArticleLesson":
        navigation.replace("ArticleLesson", {
          lessonId: previousLessonId,
          courseId,
          lessonTitle: previousLessonTitle,
        });
        break;
      case "QuizLesson":
        navigation.replace("QuizLesson", {
          lessonId: previousLessonId,
          courseId,
          lessonTitle: previousLessonTitle,
        });
        break;
      case "AssignmentLesson":
        navigation.replace("AssignmentLesson", {
          lessonId: previousLessonId,
          courseId,
          lessonTitle: previousLessonTitle,
        });
        break;
    }
  };

  const handleSelectLessonFromDrawer = (
    routeName: LessonRouteName,
    targetLessonId: string,
    targetLessonTitle: string,
  ): void => {
    if (!targetLessonId || targetLessonId === lessonId) {
      setIsLessonDrawerOpen(false);
      return;
    }

    switch (routeName) {
      case "VideoLesson":
        navigation.replace("VideoLesson", {
          lessonId: targetLessonId,
          courseId,
          lessonTitle: targetLessonTitle,
        });
        break;
      case "ArticleLesson":
        navigation.replace("ArticleLesson", {
          lessonId: targetLessonId,
          courseId,
          lessonTitle: targetLessonTitle,
        });
        break;
      case "QuizLesson":
        navigation.replace("QuizLesson", {
          lessonId: targetLessonId,
          courseId,
          lessonTitle: targetLessonTitle,
        });
        break;
      case "AssignmentLesson":
        navigation.replace("AssignmentLesson", {
          lessonId: targetLessonId,
          courseId,
          lessonTitle: targetLessonTitle,
        });
        break;
    }

    setIsLessonDrawerOpen(false);
  };

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 32;

    if (isNearBottom && !completedOnceRef.current) {
      completedOnceRef.current = true;
      setIsLessonCompleted(true);

      if (!completedLessonIds.includes(lessonId)) {
        void completeLessonMutation.mutateAsync();
      }
    }
  };

  const articleQuery = useQuery({
    queryKey: ["article-lesson", lessonId],
    queryFn: () =>
      ArticleLessonControllerService.getArticleByLessonId({ lessonId }),
    enabled: lessonId.length > 0,
  });

  if (articleQuery.isLoading) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 items-center justify-center bg-transparent"
      >
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  if (articleQuery.isError) {
    return (
      <SafeAreaView
        edges={["left", "right", "bottom"]}
        className="flex-1 items-center justify-center bg-transparent px-6"
      >
        <AppScreenBackground />
        <Text className="text-sm font-semibold text-red-600 text-center">
          Không thể tải bài nội dung.
        </Text>
        <Pressable
          className="mt-4 h-10 rounded-xl bg-violet-600 px-4 items-center justify-center"
          onPress={() => {
            void articleQuery.refetch();
          }}
        >
          <Text className="text-xs font-bold text-white">Thử lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const content = String(articleQuery.data?.data?.content ?? "").trim();
  const htmlSource = {
    html: content || "<p>Bài học chưa có nội dung.</p>",
  };

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-transparent"
    >
      <AppScreenBackground />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-0 pb-8 gap-4"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="rounded-3xl border border-white/70 bg-white/75 p-4">
          <Text className="text-lg font-black text-slate-800">
            {lessonTitle}
          </Text>
          <Text className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Cuộn đến cuối bài để hoàn thành và mở bài tiếp theo.
          </Text>
        </View>

        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
          <Text className="text-sm font-bold text-slate-800">
            Nội dung bài học
          </Text>
          <RenderHtml
            source={htmlSource}
            contentWidth={Math.max(0, width - 56)}
            tagsStyles={{
              body: {
                color: "#334155",
                fontSize: 15,
                lineHeight: 24,
              },
              h1: {
                fontSize: 26,
                lineHeight: 34,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 10,
              },
              h2: {
                fontSize: 22,
                lineHeight: 30,
                fontWeight: "800",
                color: "#0f172a",
                marginTop: 14,
                marginBottom: 8,
              },
              h3: {
                fontSize: 18,
                lineHeight: 26,
                fontWeight: "700",
                color: "#0f172a",
                marginTop: 12,
                marginBottom: 6,
              },
              p: {
                marginBottom: 10,
                color: "#334155",
              },
              li: {
                marginBottom: 6,
                color: "#334155",
              },
              ul: {
                marginBottom: 10,
              },
              ol: {
                marginBottom: 10,
              },
              strong: {
                fontWeight: "700",
                color: "#0f172a",
              },
              code: {
                fontFamily: "Menlo",
                backgroundColor: "#e2e8f0",
                color: "#0f172a",
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
              },
            }}
            baseStyle={{
              color: "#334155",
            }}
          />
        </View>
      </ScrollView>

      {previousLesson && previousLessonRoute ? (
        <Pressable
          className="absolute left-4 bottom-5 h-11 flex-row items-center gap-1 rounded-full bg-slate-900 px-4"
          onPress={handlePreviousLesson}
        >
          <Text className="text-xs font-bold text-white">←</Text>
          <Text className="text-xs font-bold text-white">Bài trước</Text>
        </Pressable>
      ) : null}

      {isLessonCompleted && nextLesson && nextLessonRoute ? (
        <Pressable
          className="absolute right-4 bottom-5 h-11 flex-row items-center gap-1 rounded-full bg-violet-600 px-4"
          onPress={handleNextLesson}
        >
          <Text className="text-xs font-bold text-white">Bài tiếp theo</Text>
          <Text className="text-xs font-bold text-white">→</Text>
        </Pressable>
      ) : null}

      <LessonDrawer
        visible={isLessonDrawerOpen}
        course={courseQuery.data}
        currentLessonId={lessonId}
        completedLessonIds={completedLessonIds}
        onClose={() => setIsLessonDrawerOpen(false)}
        onSelectLesson={handleSelectLessonFromDrawer}
      />
    </SafeAreaView>
  );
}
