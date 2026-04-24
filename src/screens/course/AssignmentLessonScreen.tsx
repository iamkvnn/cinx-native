import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AttachmentRequest } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CourseDetailResponse } from "@/types";

import LessonDrawer from "../../components/course/LessonDrawer";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { AssignmentControllerService } from "../../services/api/AssignmentControllerService";
import { AssignmentLessonControllerService } from "../../services/api/AssignmentLessonControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import { useAuthStore } from "../../store/useAuthStore";
import type { AssignmentSubmissionResponse } from "@/types";
import { uploadLearningFileToS3 } from "../../utils/uploadToS3";
import {
  extractCompletedLessonIds,
  findPreviousLesson,
  findNextLesson,
  getLessonRouteName,
  type LessonRouteName,
} from "../../utils/lessonFlow";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type AssignmentLessonScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "AssignmentLesson"
>;

type PendingAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileKey: string;
};

const formatDateTime = (value?: string | null): string => {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "(chưa có)";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sanitizeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._ -]+/g, "_").trim() || "attachment";

export default function AssignmentLessonScreen({
  route,
}: AssignmentLessonScreenProps): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const courseId = String(route.params?.courseId ?? "").trim();
  const hasCourseId = courseId.length > 0;
  const lessonId = String(route.params?.lessonId ?? "").trim();
  const assignmentId = lessonId;
  const hasAssignmentId = assignmentId.length > 0;
  const lessonTitle = route.params?.lessonTitle ?? "Assignment";
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);

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

  const isNotFoundError = (error: unknown): boolean => {
    return axios.isAxiosError(error) && error.response?.status === 404;
  };

  const assignmentQuery = useQuery({
    queryKey: ["assignment-lesson", lessonId],
    queryFn: () =>
      AssignmentLessonControllerService.getAssigmentByLessonId({ lessonId }),
    enabled: hasAssignmentId,
  });

  const submissionQuery = useQuery({
    queryKey: ["assignment-submission", lessonId],
    queryFn: async () => {
      try {
        return await AssignmentControllerService.getAssignmentSubmission({
          assignmentId,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }
    },
    enabled: hasAssignmentId,
    retry: false,
  });

  const submissionHistoryQuery = useQuery({
    queryKey: ["assignment-submission-history", lessonId],
    queryFn: () =>
      AssignmentControllerService.getAssignmentSubmissions({
        assignmentId,
        page: 1,
        size: 50,
      }),
    enabled: hasAssignmentId,
    retry: false,
  });

  const currentSubmission = submissionQuery.data?.data;
  const currentSubmissionId = String(currentSubmission?.id ?? "").trim();
  const assignmentAttachments = assignmentQuery.data?.data?.attachments ?? [];

  useEffect(() => {
    setIsLessonCompleted(
      completedLessonIds.includes(lessonId) || Boolean(currentSubmissionId),
    );
  }, [completedLessonIds, currentSubmissionId, lessonId]);

  const userHistory = useMemo(() => {
    const source = (submissionHistoryQuery.data?.data ??
      []) as AssignmentSubmissionResponse[];

    return [...source]
      .filter(
        (item) =>
          !currentUserId || String(item.userId ?? "") === String(currentUserId),
      )
      .sort((a, b) => {
        const aTime = new Date(String(a.submissionTime ?? 0)).getTime();
        const bTime = new Date(String(b.submissionTime ?? 0)).getTime();
        return bTime - aTime;
      });
  }, [currentUserId, submissionHistoryQuery.data?.data]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      await AssignmentControllerService.submitAssignment({
        assignmentId,
        requestBody: {
          content,
          attachments: attachments.map<AttachmentRequest>((item) => ({
            fileKey: item.fileKey,
            fileName: item.fileName,
            fileType: item.fileType,
            fileSize: item.fileSize,
          })),
        },
      });
    },
    onSuccess: () => {
      Alert.alert("Thành công", "Đã nộp assignment.");
      setAttachments([]);
      setContent("");
      setIsLessonCompleted(true);
      void LearningProgressControllerService.markItemAsComplete({
        itemId: lessonId,
      });
      void Promise.all([
        submissionQuery.refetch(),
        submissionHistoryQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ["assignment-submission", lessonId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["assignment-submission-history", lessonId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-detail", "item-progress", courseId],
        }),
        queryClient.invalidateQueries({ queryKey: ["course-detail"] }),
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Lỗi",
        getApiErrorMessage(error, "Không thể nộp assignment."),
      );
    },
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      await AssignmentControllerService.deleteAssignmentSubmission({
        submissionId,
      });
    },
    onSuccess: () => {
      void Promise.all([
        submissionQuery.refetch(),
        submissionHistoryQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: ["assignment-submission", lessonId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["assignment-submission-history", lessonId],
        }),
      ]);
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (asset: DocumentPicker.DocumentPickerAsset) => {
      const fileName = asset.name || `attachment-${Date.now()}`;
      const fileType = asset.mimeType || "application/octet-stream";
      const fileSize = Number(asset.size ?? 0);

      const uploaded = await uploadLearningFileToS3(
        asset.uri,
        fileName,
        fileType,
      );

      return {
        id: `${uploaded.fileKey}-${Date.now()}`,
        fileKey: uploaded.fileKey,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        fileSize,
      } satisfies PendingAttachment;
    },
    onSuccess: (attachment) => {
      setAttachments((previous) => [...previous, attachment]);
    },
  });

  const handlePickAttachment = async (): Promise<void> => {
    try {
      if (!hasAssignmentId) {
        Alert.alert("Lỗi", "Không tìm thấy assignment để nộp.");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      for (const asset of result.assets) {
        await uploadAttachmentMutation.mutateAsync(asset);
      }
    } catch (error) {
      Alert.alert(
        "Upload thất bại",
        error instanceof Error ? error.message : "Không thể upload file.",
      );
    }
  };

  const handleResubmit = async (): Promise<void> => {
    if (!currentSubmissionId) {
      return;
    }

    Alert.alert(
      "Nộp lại assignment",
      "Hệ thống hiện chỉ cho phép 1 submission cho mỗi assignment. Bạn cần xóa submission cũ trước khi nộp lại. Tiếp tục?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa và nộp lại",
          style: "destructive",
          onPress: () => {
            void deleteSubmissionMutation
              .mutateAsync(currentSubmissionId)
              .then(() => {
                setAttachments([]);
                setContent("");
              });
          },
        },
      ],
    );
  };

  const removeAttachment = (id: string): void => {
    setAttachments((previous) => previous.filter((item) => item.id !== id));
  };

  const handleDownloadAttachment = async (
    file: (typeof assignmentAttachments)[number],
  ): Promise<void> => {
    const fileUrl = String(file.attachmentUrl ?? "").trim();
    if (!fileUrl) {
      Alert.alert("Thông báo", "Tệp này chưa có đường dẫn để tải xuống.");
      return;
    }

    const fileName = sanitizeFileName(
      String(file.fileName ?? "attachment").trim(),
    );

    try {
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        await Linking.openURL(fileUrl);
        return;
      }

      const downloadedFile = await FileSystem.File.downloadFileAsync(
        fileUrl,
        new FileSystem.File(FileSystem.Paths.cache, `${Date.now()}-${fileName}`),
      );
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: file.fileType ?? "application/octet-stream",
        dialogTitle: fileName,
      });
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error instanceof Error ? error.message : "Không thể tải file.",
      );
    }
  };

  const canSubmit = useMemo(() => {
    if (!hasAssignmentId) {
      return false;
    }

    return content.trim().length > 0 || attachments.length > 0;
  }, [attachments.length, content, hasAssignmentId]);

  const canResubmit = Boolean(currentSubmissionId);

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

  if (assignmentQuery.isLoading) {
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
        <View
          className={`rounded-3xl border p-4 gap-2 ${
            currentSubmissionId
              ? "border-emerald-200 bg-emerald-50"
              : "border-white/70 bg-white/75"
          }`}
        >
          <Text className="text-lg font-black text-slate-800">
            {lessonTitle}
          </Text>
          <Text className="text-xs font-medium text-slate-700">
            {assignmentQuery.data?.data?.description ??
              "Chưa có mô tả assignment."}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Hạn nộp: {formatDateTime(assignmentQuery.data?.data?.dueDate)}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Trạng thái: {currentSubmissionId ? "Đã nộp" : "Chưa nộp"}
          </Text>
        </View>

        {assignmentAttachments.length > 0 ? (
          <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
            <Text className="text-sm font-bold text-slate-800">
              File đính kèm của giảng viên
            </Text>
            <Text className="text-xs font-medium text-slate-500">
              Bấm vào từng file để tải xuống.
            </Text>
            <View className="gap-2">
              {assignmentAttachments.map((file, index) => {
                const fileName = file.fileName ?? `Tệp đính kèm ${index + 1}`;

                return (
                  <Pressable
                    key={String(file.id ?? fileName ?? index)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                    onPress={() => {
                      void handleDownloadAttachment(file);
                    }}
                  >
                    <Text className="text-xs font-bold text-slate-800">
                      {fileName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-3">
          <Text className="text-sm font-bold text-slate-800">
            Bài nộp của bạn
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Nhập nội dung bài nộp..."
            multiline
            className="min-h-[120px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800"
          />
          <Pressable
            className="h-11 items-center justify-center rounded-2xl bg-slate-900"
            disabled={uploadAttachmentMutation.isPending}
            onPress={() => {
              void handlePickAttachment();
            }}
          >
            <Text className="text-sm font-bold text-white">
              {uploadAttachmentMutation.isPending
                ? "Đang upload file..."
                : "Chọn file đính kèm"}
            </Text>
          </Pressable>

          <FlatList
            data={attachments}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                <View className="flex-1 pr-2">
                  <Text
                    className="text-xs font-bold text-slate-800"
                    numberOfLines={1}
                  >
                    {item.fileName}
                  </Text>
                  <Text className="text-[11px] font-medium text-slate-500">
                    {item.fileType} •{" "}
                    {item.fileSize > 0
                      ? `${item.fileSize} bytes`
                      : "unknown size"}
                  </Text>
                </View>
                <Pressable
                  className="rounded-lg bg-red-50 px-2 py-1"
                  onPress={() => removeAttachment(item.id)}
                >
                  <Text className="text-[11px] font-bold text-red-600">
                    Xóa
                  </Text>
                </Pressable>
              </View>
            )}
            ItemSeparatorComponent={() => <View className="h-2" />}
            ListEmptyComponent={
              <Text className="text-xs font-medium text-slate-500">
                Chưa có file đính kèm.
              </Text>
            }
          />

          {canResubmit ? (
            <Pressable
              className="h-11 items-center justify-center rounded-2xl bg-amber-500"
              disabled={deleteSubmissionMutation.isPending}
              onPress={() => {
                void handleResubmit();
              }}
            >
              <Text className="text-sm font-bold text-white">
                {deleteSubmissionMutation.isPending
                  ? "Đang xóa submission cũ..."
                  : "Nộp lại assignment"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className="h-11 items-center justify-center rounded-2xl bg-violet-600"
              disabled={
                submitMutation.isPending ||
                uploadAttachmentMutation.isPending ||
                !canSubmit
              }
              onPress={() => {
                void submitMutation.mutateAsync();
              }}
            >
              <Text className="text-sm font-bold text-white">
                {submitMutation.isPending ? "Đang nộp..." : "Nộp assignment"}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
          <Text className="text-sm font-bold text-slate-800">
            Submission hiện tại
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Thời gian nộp: {formatDateTime(submissionQuery.data?.data?.submissionTime)}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Điểm: {String(submissionQuery.data?.data?.score ?? "--")}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Số file đã nộp:{" "}
            {Number(submissionQuery.data?.data?.attachments?.length ?? 0)}
          </Text>
          <View className="mt-2 gap-2">
            {(currentSubmission?.attachments ?? []).map((file) => (
              <View
                key={String(file.id ?? file.fileName ?? Math.random())}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <Text
                  className="text-xs font-bold text-slate-800"
                  numberOfLines={1}
                >
                  {file.fileName ?? "File đính kèm"}
                </Text>
                <Text
                  className="text-[11px] font-medium text-slate-500"
                  numberOfLines={1}
                >
                  {file.attachmentUrl ?? "(không có URL)"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
          <Text className="text-sm font-bold text-slate-800">Lịch sử nộp</Text>
          {userHistory.length > 0 ? (
            userHistory.map((item) => (
              <View
                key={String(item.id)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 gap-1"
              >
                <Text className="text-xs font-bold text-slate-800">
                  {formatDateTime(item.submissionTime)}
                </Text>
                <Text className="text-[11px] font-semibold text-slate-600">
                  Điểm: {String(item.score ?? "--")}
                </Text>
                <Text
                  className="text-[11px] font-medium text-slate-500"
                  numberOfLines={2}
                >
                  {String(item.content ?? "") || "Không có nội dung"}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-xs font-medium text-slate-500">
              Chưa có lịch sử nộp.
            </Text>
          )}
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
