import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CourseDetailResponse } from "@/types";
import LessonDrawer from "../../components/course/LessonDrawer";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import env from "../../env";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { VideoLessonControllerService } from "../../services/api/VideoLessonControllerService";
import { VideoTrackingControllerService } from "../../services/api/VideoTrackingControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import {
  extractCompletedLessonIds,
  findPreviousLesson,
  findNextLesson,
  getLessonRouteName,
  type LessonRouteName,
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
  const [videoPlaybackError, setVideoPlaybackError] = useState<string | null>(
    null,
  );
  const [isOpeningBrowser, setIsOpeningBrowser] = useState(false);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
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

  useEffect(() => {
    const fromApi = Number(trackingQuery.data?.data?.currentPosition ?? 0);

    if (Number.isFinite(fromApi) && fromApi >= 0) {
      setCurrentPosition(fromApi);
    }
  }, [trackingQuery.data?.data?.currentPosition]);

  useEffect(() => {
    setIsLessonCompleted(completedLessonIds.includes(lessonId));
  }, [completedLessonIds, lessonId]);

  const rawVideoUrl = useMemo(() => {
    return String(videoQuery.data?.data?.videoUrl ?? "").trim();
  }, [videoQuery.data?.data?.videoUrl]);

  const videoUrl = useMemo(() => {
    if (!rawVideoUrl) {
      return "";
    }

    let normalized = rawVideoUrl
      .replace(/[\r\n\t]/g, "")
      .replace(/^['\"]+|['\"]+$/g, "")
      .trim();

    // Some environments return malformed separators like https:\\...
    normalized = normalized.replace(/\\+/g, "/");

    if (/^https?:\/[^/]/i.test(normalized)) {
      normalized = normalized.replace(/^https?:\//i, (prefix) => `${prefix}/`);
    }

    if (normalized.startsWith("//")) {
      normalized = `https:${normalized}`;
    } else if (normalized.startsWith("/")) {
      normalized = `${env.apiUrl}${normalized}`;
    } else if (!/^https?:\/\//i.test(normalized)) {
      normalized = `${env.apiUrl.replace(/\/$/, "")}/${normalized.replace(/^\//, "")}`;
    }

    try {
      const encoded = encodeURI(normalized);
      const parsed = new URL(encoded);

      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return "";
      }

      return encoded;
    } catch {
      return "";
    }
  }, [rawVideoUrl]);

  const hasPlayableVideoUrl = useMemo(() => {
    return /^https?:\/\//i.test(videoUrl);
  }, [videoUrl]);

  const handleOpenVideoInBrowser = async (): Promise<void> => {
    if (!videoUrl || isOpeningBrowser) {
      return;
    }

    try {
      setIsOpeningBrowser(true);
      const supported = await Linking.canOpenURL(videoUrl);

      if (!supported) {
        setVideoPlaybackError("Thiết bị không hỗ trợ mở URL video này.");
        return;
      }

      await Linking.openURL(videoUrl);
    } catch (error) {
      setVideoPlaybackError(
        `Không thể mở video bằng trình duyệt: ${String(error)}`,
      );
    } finally {
      setIsOpeningBrowser(false);
    }
  };

  useEffect(() => {
    setVideoPlaybackError(null);
  }, [videoUrl]);

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
          {videoUrl && hasPlayableVideoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onError={(error) => {
                setVideoPlaybackError(String(error ?? "Không thể phát video."));
              }}
              style={{
                width: "100%",
                height: 240,
                backgroundColor: "#000",
              }}
            />
          ) : (
            <View className="h-[240px] items-center justify-center bg-slate-950 px-6">
              <Text className="text-center text-sm font-medium text-white/80">
                {rawVideoUrl
                  ? "Backend trả video URL không hợp lệ cho bài học này."
                  : "Backend chưa trả video URL cho bài học này."}
              </Text>
            </View>
          )}
        </View>

        {rawVideoUrl && !hasPlayableVideoUrl ? (
          <View className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Text className="text-xs font-semibold text-amber-700">
              URL video backend trả về: {rawVideoUrl}
            </Text>
          </View>
        ) : null}

        {videoPlaybackError ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-xs font-semibold text-red-700">
              Không thể phát video: {videoPlaybackError}
            </Text>
            {hasPlayableVideoUrl ? (
              <Pressable
                className="mt-3 h-10 items-center justify-center rounded-xl bg-red-600"
                onPress={() => {
                  void handleOpenVideoInBrowser();
                }}
                disabled={isOpeningBrowser}
              >
                <Text className="text-xs font-bold text-white">
                  {isOpeningBrowser
                    ? "Đang mở trình duyệt..."
                    : "Mở video bằng trình duyệt"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="px-1">
          <Text className="text-lg font-black text-slate-800">
            {lessonTitle}
          </Text>
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
