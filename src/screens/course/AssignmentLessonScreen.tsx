import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AttachmentRequest } from "@/types";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CourseDetailResponse } from "@/types";

import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { CourseControllerService } from "../../services/api/CourseControllerService";
import { AssignmentControllerService } from "../../services/api/AssignmentControllerService";
import { AssignmentLessonControllerService } from "../../services/api/AssignmentLessonControllerService";
import { PresignedUrlControllerService } from "../../services/api/PresignedUrlControllerService";
import { LearningProgressControllerService } from "../../services/api/LearningProgressControllerService";
import { useAuthStore } from "../../store/useAuthStore";
import type { AssignmentSubmissionResponse } from "@/types";
import {
  extractCompletedLessonIds,
  findNextLesson,
  getLessonRouteName,
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

export default function AssignmentLessonScreen({
  route,
}: AssignmentLessonScreenProps): ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const courseId = String(route.params?.courseId ?? "").trim();
  const hasCourseId = courseId.length > 0;
  const lessonId = String(route.params?.lessonId ?? "").trim();
  const lessonTitle = route.params?.lessonTitle ?? "Assignment";
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);

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

  const assignmentQuery = useQuery({
    queryKey: ["assignment-lesson", lessonId],
    queryFn: () =>
      AssignmentLessonControllerService.getAssigmentByLessonId({ lessonId }),
    enabled: lessonId.length > 0,
  });

  const submissionQuery = useQuery({
    queryKey: ["assignment-submission", lessonId],
    queryFn: () =>
      AssignmentControllerService.getAssignmentSubmission({
        assignmentId: lessonId,
      }),
    enabled: lessonId.length > 0,
    retry: false,
  });

  const submissionHistoryQuery = useQuery({
    queryKey: ["assignment-submission-history", lessonId],
    queryFn: () =>
      AssignmentControllerService.getAssignmentSubmissions({
        assignmentId: lessonId,
        page: 1,
        size: 50,
      }),
    enabled: lessonId.length > 0,
    retry: false,
  });

  const currentSubmission = submissionQuery.data?.data;
  const currentSubmissionId = String(currentSubmission?.id ?? "").trim();

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
        assignmentId: lessonId,
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

      const presigned =
        await PresignedUrlControllerService.getLearningPresignedUrl({
          fileName,
          contentType: fileType,
        });

      const fileKey = String(presigned.data?.fileKey ?? "");
      const presignedUrl = String(presigned.data?.presignedUrl ?? "");

      if (!fileKey || !presignedUrl) {
        throw new Error("Không lấy được đường dẫn upload file.");
      }

      const blob = await (await fetch(asset.uri)).blob();
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": fileType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload file thất bại.");
      }

      return {
        id: `${fileKey}-${Date.now()}`,
        fileKey,
        fileName,
        fileType,
        fileSize,
      } satisfies PendingAttachment;
    },
    onSuccess: (attachment) => {
      setAttachments((previous) => [...previous, attachment]);
    },
  });

  const handlePickAttachment = async (): Promise<void> => {
    try {
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

  const canSubmit = useMemo(() => {
    return content.trim().length > 0 || attachments.length > 0;
  }, [attachments.length, content]);

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
        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
          <Text className="text-lg font-black text-slate-800">
            {lessonTitle}
          </Text>
          <Text className="text-xs font-medium text-slate-700">
            {assignmentQuery.data?.data?.description ??
              "Chưa có mô tả assignment."}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Hạn nộp: {assignmentQuery.data?.data?.dueDate ?? "(chưa có)"}
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Trạng thái: {currentSubmissionId ? "Đã nộp" : "Chưa nộp"}
          </Text>
        </View>

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

          <Pressable
            className="h-11 items-center justify-center rounded-2xl bg-violet-600"
            disabled={
              submitMutation.isPending ||
              uploadAttachmentMutation.isPending ||
              !canSubmit ||
              canResubmit
            }
            onPress={() => {
              void submitMutation.mutateAsync();
            }}
          >
            <Text className="text-sm font-bold text-white">
              {submitMutation.isPending
                ? "Đang nộp..."
                : canResubmit
                  ? "Đã nộp - dùng Nộp lại"
                  : "Nộp assignment"}
            </Text>
          </Pressable>

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
          ) : null}
        </View>

        <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
          <Text className="text-sm font-bold text-slate-800">
            Submission hiện tại
          </Text>
          <Text className="text-xs font-semibold text-slate-600">
            Thời gian nộp:{" "}
            {String(submissionQuery.data?.data?.submissionTime ?? "--")}
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
                  {String(item.submissionTime ?? "")}
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
