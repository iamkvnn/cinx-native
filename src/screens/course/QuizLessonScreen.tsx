import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  ChooseQuizAnswerRequest,
  CourseDetailResponse,
  QuizQuestionResponse,
  QuizSessionQuestionResponse,
  QuizSessionResponse,
} from "@/types";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { QuizLessonControllerService } from "../../services/api/QuizLessonControllerService";
import { QuizSessionControllerService } from "../../services/api/QuizSessionControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import { useAuthStore } from "../../store/useAuthStore";
import {
  extractCompletedLessonIds,
  findNextLesson,
  getLessonRouteName,
} from "../../utils/lessonFlow";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type QuizLessonScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "QuizLesson"
>;

export default function QuizLessonScreen({
  route,
}: QuizLessonScreenProps): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const courseId = String(route.params?.courseId ?? "").trim();
  const hasCourseId = courseId.length > 0;
  const lessonId = String(route.params?.lessonId ?? "").trim();
  const lessonTitle = route.params?.lessonTitle ?? "Bài quiz";

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

  const quizQuery = useQuery({
    queryKey: ["quiz-lesson", lessonId],
    queryFn: () => QuizLessonControllerService.getQuizByLessonId({ lessonId }),
    enabled: lessonId.length > 0,
  });

  const resolvedQuizLessonId = useMemo(() => {
    const fromApi = quizQuery.data?.data as
      | { id?: string; quizLessonId?: string }
      | undefined;
    const candidate = fromApi?.id ?? fromApi?.quizLessonId ?? lessonId;
    return String(candidate ?? "").trim();
  }, [quizQuery.data?.data, lessonId]);

  const itemProgressQuery = useQuery({
    queryKey: ["course-detail", "item-progress", courseId],
    queryFn: () =>
      LearningProgressControllerService.getLearningItemProgressByCourseId({
        courseId,
      }),
    enabled: hasCourseId,
    retry: false,
  });

  const [quizSessionId, setQuizSessionId] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [submissionResult, setSubmissionResult] =
    useState<QuizSessionResponse | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const autoSubmittedRef = useRef(false);

  const completedLessonIds = useMemo(() => {
    return extractCompletedLessonIds(itemProgressQuery.data?.data);
  }, [itemProgressQuery.data?.data]);

  const nextLesson = useMemo(() => {
    return findNextLesson(courseQuery.data, lessonId);
  }, [courseQuery.data, lessonId]);

  const nextLessonRoute = getLessonRouteName(nextLesson?.lessonType);

  const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as
        | { message?: string; error?: string }
        | undefined;
      return data?.message ?? data?.error ?? fallback;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallback;
  };

  const isAttemptLimitError = (error: unknown): boolean => {
    const message = getApiErrorMessage(error, "").toLowerCase();
    return (
      message.includes("maximum") ||
      message.includes("max attempt") ||
      message.includes("reach the maximum") ||
      message.includes("vuot qua so lan") ||
      message.includes("vượt quá số lần")
    );
  };

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const existingSessions = (quizSessionsQuery.data?.data ??
        []) as QuizSessionResponse[];
      const inProgressSession = existingSessions.find(
        (session) => String(session.status ?? "") === "IN_PROGRESS",
      );

      if (inProgressSession?.id) {
        return String(inProgressSession.id);
      }

      const candidates = Array.from(
        new Set([resolvedQuizLessonId, lessonId].map((id) => id.trim())),
      ).filter(Boolean);

      let lastError: unknown = null;

      for (const quizLessonId of candidates) {
        try {
          const response = await QuizSessionControllerService.createQuizSession(
            {
              quizLessonId,
            },
          );

          return String(response.data?.id ?? "");
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError ?? new Error("Không thể tạo quiz session.");
    },
    onSuccess: (sessionId) => {
      if (sessionId) {
        setQuizSessionId(sessionId);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setSubmissionResult(null);
        setTimerStarted(false);
        autoSubmittedRef.current = false;
      }
    },
    onError: (error) => {
      const existingSessions = (quizSessionsQuery.data?.data ??
        []) as QuizSessionResponse[];
      const inProgressSession = existingSessions.find(
        (session) => String(session.status ?? "") === "IN_PROGRESS",
      );

      if (isAttemptLimitError(error) && inProgressSession?.id) {
        setQuizSessionId(String(inProgressSession.id));
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setSubmissionResult(null);
        setTimerStarted(false);
        autoSubmittedRef.current = false;
        Alert.alert("Thông báo", "Đang tiếp tục lượt làm trước đó.");
        return;
      }

      Alert.alert(
        "Không thể tạo lượt làm mới",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    },
  });

  const quizSessionsQuery = useQuery({
    queryKey: ["quiz-sessions", resolvedQuizLessonId, currentUserId],
    queryFn: () =>
      QuizSessionControllerService.getQuizSessions({
        quizLessonId: resolvedQuizLessonId,
        userId: currentUserId ? String(currentUserId) : undefined,
        page: 1,
        size: 20,
        sort: "startTime,desc",
      }),
    enabled: resolvedQuizLessonId.length > 0,
    retry: false,
  });

  const sessionQuestionsQuery = useQuery({
    queryKey: ["quiz-session-questions", quizSessionId],
    queryFn: () =>
      QuizSessionControllerService.getQuizSessionQuestions({
        quizSessionId,
        page: 1,
        size: 100,
      }),
    enabled: quizSessionId.length > 0,
  });

  const chooseMutation = useMutation({
    mutationFn: async ({ questionId, userAnswer }: ChooseQuizAnswerRequest) => {
      if (!quizSessionId) {
        throw new Error("Quiz session chưa được tạo.");
      }

      await QuizSessionControllerService.chooseQuizSessionQuestion({
        quizSessionId,
        requestBody: {
          questionId,
          userAnswer,
        },
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quizSessionId) {
        throw new Error("Quiz session chưa được tạo.");
      }

      const answers = Object.entries(selectedAnswers).map(
        ([questionId, userAnswer]) => ({ questionId, userAnswer }),
      );

      return QuizSessionControllerService.submitQuizSession({
        quizSessionId,
        requestBody: { answers },
      });
    },
    onSuccess: (result) => {
      setSubmissionResult(result.data ?? null);
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

  const questionMap = useMemo(() => {
    const map = new Map<string, QuizQuestionResponse>();

    for (const item of quizQuery.data?.data?.questions ?? []) {
      if (item.id) {
        map.set(item.id, item);
      }
    }

    return map;
  }, [quizQuery.data?.data?.questions]);

  const sessionQuestions = (sessionQuestionsQuery.data?.data ??
    []) as QuizSessionQuestionResponse[];

  const totalDurationSeconds = useMemo(() => {
    const minutes = Number(quizQuery.data?.data?.duration ?? 0);
    return Math.max(0, Math.floor(minutes * 60));
  }, [quizQuery.data?.data?.duration]);

  useEffect(() => {
    if (!quizSessionId || submissionResult) {
      return;
    }

    if (totalDurationSeconds <= 0) {
      setTimeRemaining(0);
      setTimerStarted(false);
      return;
    }

    setTimeRemaining(totalDurationSeconds);
    setTimerStarted(true);
  }, [quizSessionId, submissionResult, totalDurationSeconds]);

  useEffect(() => {
    if (
      !quizSessionId ||
      submissionResult ||
      !timerStarted ||
      timeRemaining <= 0
    ) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setTimeRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [quizSessionId, submissionResult, timeRemaining, timerStarted]);

  useEffect(() => {
    if (
      !quizSessionId ||
      submissionResult ||
      !timerStarted ||
      timeRemaining > 0 ||
      autoSubmittedRef.current
    ) {
      return;
    }

    autoSubmittedRef.current = true;
    void handleSubmitQuiz(true);
  }, [quizSessionId, submissionResult, timeRemaining, timerStarted]);

  useEffect(() => {
    setIsLessonCompleted(completedLessonIds.includes(lessonId));
  }, [completedLessonIds, lessonId]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeRemaining / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(timeRemaining % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [timeRemaining]);

  const currentSessionQuestion = sessionQuestions[currentQuestionIndex];
  const currentQuestionId = String(currentSessionQuestion?.questionId ?? "");
  const currentQuestion = questionMap.get(currentQuestionId);
  const attemptsUsed = Number(quizSessionsQuery.data?.meta?.totalElements ?? 0);

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

  const handleSelectAnswer = async (
    questionId: string,
    userAnswer: string,
  ): Promise<void> => {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: userAnswer,
    }));

    try {
      await chooseMutation.mutateAsync({
        questionId,
        userAnswer,
      });
    } catch (error) {
      Alert.alert(
        "Lỗi",
        getApiErrorMessage(error, "Không lưu được đáp án vừa chọn."),
      );
    }
  };

  const handleSubmitQuiz = async (fromTimeout = false): Promise<void> => {
    try {
      const result = await submitMutation.mutateAsync();
      const score = Number(result.data?.quizSessionSubmission?.score ?? 0);
      const totalCorrect = Number(
        result.data?.quizSessionSubmission?.totalCorrectAnswers ?? 0,
      );

      Alert.alert(
        fromTimeout ? "Hết giờ" : "Đã nộp bài",
        `Điểm: ${score} | Câu đúng: ${totalCorrect}`,
      );

      if (!completedLessonIds.includes(lessonId)) {
        setIsLessonCompleted(true);
        void completeLessonMutation.mutateAsync();
      }
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể nộp quiz."));
    }
  };

  if (quizQuery.isLoading) {
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
        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
          <Text className="text-lg font-black text-slate-800">
            {lessonTitle}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Thời lượng: {Number(quizQuery.data?.data?.duration ?? 0)} phút
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Số câu/session:{" "}
            {Number(quizQuery.data?.data?.numberOfQuestionPerQuizSession ?? 0)}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Số lần làm: {attemptsUsed}
          </Text>
        </View>

        {!quizSessionId ? (
          <Pressable
            className="h-11 items-center justify-center rounded-2xl bg-violet-600"
            disabled={createSessionMutation.isPending}
            onPress={() => {
              void createSessionMutation.mutateAsync();
            }}
          >
            <Text className="text-sm font-bold text-white">
              {createSessionMutation.isPending
                ? "Đang tạo session..."
                : "Bắt đầu quiz"}
            </Text>
          </Pressable>
        ) : (
          <View className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2">
            <Text className="mt-1 text-sm font-black text-violet-900">
              Thời gian còn lại: {formattedTime}
            </Text>
          </View>
        )}

        {quizSessionId && currentSessionQuestion ? (
          <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-3">
            <Text className="text-xs font-semibold text-slate-500">
              Câu {currentQuestionIndex + 1}/{sessionQuestions.length}
            </Text>
            <Text className="text-sm font-bold text-slate-800">
              {currentQuestion?.questionText ?? "(Đang tải nội dung câu hỏi)"}
            </Text>

            {(currentQuestion?.options?.length ?? 0) > 0 ? (
              (currentQuestion?.options ?? []).map((option, optionIndex) => {
                const optionText = String(option.optionText ?? "");
                const optionOrder = Number(
                  option.optionOrder ?? optionIndex + 1,
                );
                const optionAnswerValue = `[${optionOrder}]`;
                const isSelected =
                  selectedAnswers[currentQuestionId] === optionAnswerValue;

                return (
                  <Pressable
                    key={`${currentQuestionId}-option-${optionIndex}`}
                    className={`rounded-xl border px-3 py-2 ${
                      isSelected
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() => {
                      void handleSelectAnswer(
                        currentQuestionId,
                        optionAnswerValue,
                      );
                    }}
                  >
                    <Text className="text-xs font-semibold text-slate-700">
                      {optionText || `Đáp án ${optionIndex + 1}`}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <TextInput
                value={selectedAnswers[currentQuestionId] ?? ""}
                onChangeText={(value) => {
                  setSelectedAnswers((previous) => ({
                    ...previous,
                    [currentQuestionId]: value,
                  }));
                }}
                placeholder="Nhập câu trả lời..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800"
                onBlur={() => {
                  void handleSelectAnswer(
                    currentQuestionId,
                    selectedAnswers[currentQuestionId] ?? "",
                  );
                }}
              />
            )}

            <View className="mt-1 flex-row items-center justify-between">
              <Pressable
                className={`h-10 rounded-xl px-4 items-center justify-center ${currentQuestionIndex === 0 ? "bg-slate-200" : "bg-slate-900"}`}
                disabled={currentQuestionIndex === 0}
                onPress={() => {
                  setCurrentQuestionIndex((previous) =>
                    Math.max(0, previous - 1),
                  );
                }}
              >
                <Text className="text-xs font-bold text-white">Câu trước</Text>
              </Pressable>

              <Pressable
                className={`h-10 rounded-xl px-4 items-center justify-center ${currentQuestionIndex >= sessionQuestions.length - 1 ? "bg-slate-200" : "bg-violet-600"}`}
                disabled={currentQuestionIndex >= sessionQuestions.length - 1}
                onPress={() => {
                  setCurrentQuestionIndex((previous) =>
                    Math.min(sessionQuestions.length - 1, previous + 1),
                  );
                }}
              >
                <Text className="text-xs font-bold text-white">Câu sau</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {quizSessionId ? (
          <Pressable
            className="h-11 items-center justify-center rounded-2xl bg-slate-900"
            disabled={submitMutation.isPending || Boolean(submissionResult)}
            onPress={() => {
              void handleSubmitQuiz(false);
            }}
          >
            <Text className="text-sm font-bold text-white">
              {submitMutation.isPending
                ? "Đang nộp bài..."
                : submissionResult
                  ? "Đã nộp"
                  : "Nộp quiz"}
            </Text>
          </Pressable>
        ) : null}

        {submissionResult ? (
          <View className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 gap-1">
            <Text className="text-sm font-black text-emerald-700">
              Kết quả quiz
            </Text>
            <Text className="text-xs font-semibold text-emerald-800">
              Trạng thái: {String(submissionResult.status ?? "SUBMITTED")}
            </Text>
            <Text className="text-xs font-semibold text-emerald-800">
              Điểm: {Number(submissionResult.quizSessionSubmission?.score ?? 0)}
            </Text>
            <Text className="text-xs font-semibold text-emerald-800">
              Câu đúng:{" "}
              {Number(
                submissionResult.quizSessionSubmission?.totalCorrectAnswers ??
                  0,
              )}
            </Text>
            <Pressable
              className="mt-2 h-10 items-center justify-center rounded-xl bg-violet-600"
              disabled={createSessionMutation.isPending}
              onPress={() => {
                void createSessionMutation.mutateAsync().then(() => {
                  void quizSessionsQuery.refetch();
                });
              }}
            >
              <Text className="text-xs font-bold text-white">
                {createSessionMutation.isPending
                  ? "Đang tạo lượt mới..."
                  : "Làm lại quiz"}
              </Text>
            </Pressable>
          </View>
        ) : null}
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
