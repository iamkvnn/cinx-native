import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CourseDetailResponse } from "@/types";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { VideoLessonControllerService } from "../../services/api/VideoLessonControllerService";
import { VideoTrackingControllerService } from "../../services/api/VideoTrackingControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import {
  extractCompletedLessonIds,
  findNextLesson,
  getLessonRouteName,
} from "../../utils/lessonFlow";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type VideoLessonScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "VideoLesson"
>;

export default function VideoLessonScreen({
  route,
}: VideoLessonScreenProps): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const courseId = String(route.params?.courseId ?? "").trim();
  const hasCourseId = courseId.length > 0;
  const lessonId = String(route.params?.lessonId ?? "").trim();
  const lessonTitle = route.params?.lessonTitle ?? "Video bài học";

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

  const videoQuery = useQuery({
    queryKey: ["video-lesson", lessonId],
    queryFn: () =>
      VideoLessonControllerService.getVideoByLessonId({ lessonId }),
    enabled: lessonId.length > 0,
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

  const trackingQuery = useQuery({
    queryKey: ["video-tracking", lessonId],
    queryFn: () =>
      VideoTrackingControllerService.getVideoLessonTrackingHistory({
        videoLessonId: lessonId,
      }),
    enabled: lessonId.length > 0,
    retry: false,
  });

  const [currentPosition, setCurrentPosition] = useState(0);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const resumeAppliedRef = useRef(false);
  const lastSyncedPositionRef = useRef(0);
  const isSavingRef = useRef(false);
  const videoRef = useRef<Video | null>(null);

  const completedLessonIds = useMemo(() => {
    return extractCompletedLessonIds(itemProgressQuery.data?.data);
  }, [itemProgressQuery.data?.data]);

  const nextLesson = useMemo(() => {
    return findNextLesson(courseQuery.data, lessonId);
  }, [courseQuery.data, lessonId]);

  const nextLessonRoute = getLessonRouteName(nextLesson?.lessonType);

  useEffect(() => {
    const fromApi = Number(trackingQuery.data?.data?.currentPosition ?? 0);

    if (Number.isFinite(fromApi) && fromApi >= 0) {
      setCurrentPosition(fromApi);
    }
  }, [trackingQuery.data?.data?.currentPosition]);

  useEffect(() => {
    setIsLessonCompleted(completedLessonIds.includes(lessonId));
  }, [completedLessonIds, lessonId]);

  const videoUrl = useMemo(() => {
    return String(videoQuery.data?.data?.videoUrl ?? "").trim();
  }, [videoQuery.data?.data?.videoUrl]);

  const trackMutation = useMutation({
    mutationFn: async (nextPosition: number) => {
      await VideoTrackingControllerService.trackVideoProgress({
        requestBody: {
          videoLessonId: lessonId,
          currentPosition: nextPosition,
        },
      });
      return nextPosition;
    },
    onSuccess: (nextPosition) => {
      setCurrentPosition(nextPosition);
      lastSyncedPositionRef.current = nextPosition;
    },
  });

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

  const saveProgress = async (force = false): Promise<void> => {
    if (!lessonId || !videoUrl || isSavingRef.current) {
      return;
    }

    const nextPosition = Math.max(0, Math.floor(Number(currentPosition ?? 0)));

    if (!Number.isFinite(nextPosition)) {
      return;
    }

    if (!force && Math.abs(nextPosition - lastSyncedPositionRef.current) < 5) {
      return;
    }

    try {
      isSavingRef.current = true;
      await trackMutation.mutateAsync(nextPosition);
    } finally {
      isSavingRef.current = false;
    }
  };

  useEffect(() => {
    if (!videoUrl || resumeAppliedRef.current) {
      return;
    }

    const resumePosition = Number(
      trackingQuery.data?.data?.currentPosition ?? 0,
    );

    if (Number.isFinite(resumePosition) && resumePosition > 0) {
      setCurrentPosition(resumePosition);
      lastSyncedPositionRef.current = resumePosition;
      void videoRef.current?.setPositionAsync(resumePosition * 1000);
    }

    resumeAppliedRef.current = true;
  }, [trackingQuery.data?.data?.currentPosition, videoUrl]);

  useEffect(() => {
    if (!videoUrl) {
      return;
    }

    const syncInterval = setInterval(() => {
      void saveProgress(false);
    }, 5000);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state !== "active") {
          void saveProgress(true);
        }
      },
    );

    return () => {
      clearInterval(syncInterval);
      appStateSubscription.remove();
      void saveProgress(true);
    };
  }, [videoUrl, currentPosition]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      return;
    }

    const nextPosition = Math.max(0, Math.floor(status.positionMillis / 1000));
    setCurrentPosition(nextPosition);

    if (status.didJustFinish && !isLessonCompleted) {
      void completeLessonMutation.mutateAsync();
    }
  };

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
        navigation.navigate("VideoLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
      case "ArticleLesson":
        navigation.navigate("ArticleLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
      case "QuizLesson":
        navigation.navigate("QuizLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
      case "AssignmentLesson":
        navigation.navigate("AssignmentLesson", {
          lessonId: nextLessonId,
          courseId,
          lessonTitle: nextLessonTitle,
        });
        break;
    }
  };

  if (videoQuery.isLoading) {
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

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-transparent"
    >
      <AppScreenBackground />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-0 pb-8 gap-4"
      >
        <View className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75">
          {videoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              style={{
                width: "100%",
                height: 240,
                backgroundColor: "#000",
              }}
            />
          ) : (
            <View className="h-[240px] items-center justify-center bg-slate-950 px-6">
              <Text className="text-center text-sm font-medium text-white/80">
                Backend chưa trả video URL cho bài học này.
              </Text>
            </View>
          )}
        </View>

        <View className="px-1">
          <Text className="text-lg font-black text-slate-800">
            {lessonTitle}
          </Text>
        </View>
      </ScrollView>

      {isLessonCompleted && nextLesson && nextLessonRoute ? (
        <View className="px-4 pb-4">
          <Pressable
            className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-violet-600"
            onPress={handleNextLesson}
          >
            <Text className="text-sm font-bold text-white">Bài tiếp theo</Text>
            <Text className="text-sm font-bold text-white">→</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
