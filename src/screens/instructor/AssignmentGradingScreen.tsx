import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CourseControllerService, OpenAPI } from "../../api/course";
import { AssignmentControllerService } from "../../services/api/AssignmentControllerService";
import { UserControllerService } from "../../api/user/services/UserControllerService";
import { OpenAPI as UserOpenAPI } from "../../api/user/core/OpenAPI";
import { useAuthStore } from "../../store/useAuthStore";
import type { AssignmentSubmissionResponse } from "@/types";
import type { CourseResponse } from "../../api/course/models/CourseResponse";

type AssignmentLessonItem = {
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
};

const getErrorText = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "Không xác định";
  }

  const maybeError = error as {
    body?: { message?: string };
    message?: string;
  };

  return maybeError.body?.message ?? maybeError.message ?? "Không xác định";
};

const COURSE_PAGE_SIZE = 8;

const extractAssignmentLessons = (sections: Array<any>): AssignmentLessonItem[] => {
  const items: AssignmentLessonItem[] = [];

  sections.forEach((section) => {
    const sectionTitle = section.title ?? "Chương";
    (section.lessons ?? []).forEach((lesson: any) => {
      if (lesson.lessonType === "ASSIGNMENT" && lesson.id) {
        items.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title ?? "Assignment",
          sectionTitle,
        });
      }
    });
  });

  return items;
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("vi-VN");
};

type CourseCardProps = {
  course: CourseResponse;
  isActive: boolean;
  onPress: () => void;
};

function CourseCard({ course, isActive, onPress }: CourseCardProps): ReactElement | null {
  const courseId = String(course.id ?? "").trim();
  const imageUrl = String(course.images?.[0]?.imageUrl ?? "").trim();

  if (!courseId) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      className={`mr-3 w-72 overflow-hidden rounded-2xl border ${
        isActive ? "border-violet-500" : "border-slate-200"
      } bg-white`}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="h-36 w-full" resizeMode="cover" />
      ) : (
        <View className="h-36 w-full items-center justify-center bg-slate-200">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
            No cover
          </Text>
        </View>
      )}

      <View className="px-3 py-3">
        <Text className="text-sm font-black text-slate-800" numberOfLines={2}>
          {course.title ?? "Khóa học"}
        </Text>

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-slate-600">Bấm để xem assignment</Text>

          {isActive ? (
            <Text className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">
              Đang chọn
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function AssignmentGradingScreen(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const instructorId = String(user?.id ?? user?.userId ?? "").trim();
  const hasInstructorId = instructorId.length > 0;
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState("");

  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      OpenAPI.TOKEN = accessToken;
      UserOpenAPI.TOKEN = accessToken;
    }
  }, [accessToken]);

  const coursesQuery = useInfiniteQuery({
    queryKey: ["instructor-assignment-grading", "courses", instructorId],
    queryFn: ({ pageParam }) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        OpenAPI.TOKEN = token;
      }

      return CourseControllerService.getAllCourses({
        instructorId,
        page: Number(pageParam),
        size: COURSE_PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const totalPages = Number(lastPage.meta?.totalPages ?? page);
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: hasInstructorId,
  });

  const instructorCourses = useMemo(() => {
    const all = coursesQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [];
    const map = new Map<string, CourseResponse>();

    all.forEach((course) => {
      const courseId = String(course.id ?? "").trim();
      if (!courseId) {
        return;
      }
      map.set(courseId, course);
    });

    return Array.from(map.values());
  }, [coursesQuery.data?.pages]);

  useEffect(() => {
    if (!instructorCourses.length) {
      setSelectedCourseId("");
      return;
    }

    const stillExists = instructorCourses.some(
      (course) => String(course.id ?? "").trim() === selectedCourseId,
    );

    if (!stillExists && selectedCourseId) {
      setSelectedCourseId("");
    }
  }, [instructorCourses, selectedCourseId]);

  useEffect(() => {
    setSelectedAssignmentId("");
    setScoreInputs({});
  }, [selectedCourseId]);

  const courseQuery = useQuery({
    queryKey: ["instructor-assignment-grading", "course", selectedCourseId],
    queryFn: () => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        OpenAPI.TOKEN = token;
      }

      return CourseControllerService.getCourseById({ id: selectedCourseId });
    },
    enabled: selectedCourseId.length > 0,
  });

  const selectedCourseTitle = String(courseQuery.data?.data?.title ?? "").trim();

  const assignmentLessons = useMemo<AssignmentLessonItem[]>(() => {
    return extractAssignmentLessons(courseQuery.data?.data?.sections ?? []);
  }, [courseQuery.data?.data?.sections]);

  useEffect(() => {
    if (!assignmentLessons.length) {
      setSelectedAssignmentId("");
      return;
    }

    const stillExists = assignmentLessons.some(
      (item) => item.lessonId === selectedAssignmentId,
    );

    if (!stillExists && selectedAssignmentId) {
      setSelectedAssignmentId("");
    }
  }, [assignmentLessons, selectedAssignmentId]);

  const handleLoadMoreCourses = (): void => {
    if (coursesQuery.hasNextPage && !coursesQuery.isFetchingNextPage) {
      void coursesQuery.fetchNextPage();
    }
  };

  const submissionsQuery = useQuery({
    queryKey: [
      "instructor-assignment-grading",
      "submissions",
      selectedAssignmentId,
    ],
    queryFn: () =>
      AssignmentControllerService.getAssignmentSubmissions({
        assignmentId: selectedAssignmentId,
        page: 1,
        size: 200,
        sort: "submissionTime,desc",
      }),
    enabled: selectedAssignmentId.length > 0,
    retry: false,
  });

  const submissions = (submissionsQuery.data?.data ??
    []) as AssignmentSubmissionResponse[];

  const studentNamesQuery = useQuery({
    queryKey: [
      "instructor-assignment-grading",
      "students",
      selectedAssignmentId,
      submissions.map((item) => item.userId).join(","),
    ],
    queryFn: async () => {
      const ids = Array.from(
        new Set(
          submissions
            .map((item) => String(item.userId ?? "").trim())
            .filter(Boolean),
        ),
      );

      if (!ids.length) {
        return {} as Record<string, string>;
      }

      const response = await UserControllerService.getUsersByIds({ ids });
      const users = response.data ?? [];
      const map: Record<string, string> = {};

      users.forEach((userDto) => {
        const id = String(userDto.userId ?? "").trim();
        if (!id) {
          return;
        }

        map[id] = String(userDto.name ?? "").trim() || "Học viên";
      });

      return map;
    },
    enabled: selectedAssignmentId.length > 0 && submissions.length > 0,
    retry: false,
  });

  const studentNameMap = studentNamesQuery.data ?? {};

  const scoreMutation = useMutation({
    mutationFn: async ({ submissionId, score }: { submissionId: string; score: number }) => {
      await AssignmentControllerService.scoreAssignmentSubmission({
        submissionId,
        score,
      });
    },
    onSuccess: async () => {
      setGradingSubmissionId("");
      await submissionsQuery.refetch();
      Alert.alert("Thành công", "Đã chấm điểm bài nộp.");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Không thể chấm điểm.";
      Alert.alert("Lỗi", message);
    },
  });

  const handleGradeSubmission = async (submissionId: string): Promise<void> => {
    const rawScore = String(scoreInputs[submissionId] ?? "").trim();
    const score = Number(rawScore);

    if (!rawScore || Number.isNaN(score)) {
      Alert.alert("Điểm chưa hợp lệ", "Vui lòng nhập điểm dạng số.");
      return;
    }

    if (score < 0 || score > 100) {
      Alert.alert("Điểm chưa hợp lệ", "Điểm phải nằm trong khoảng 0 đến 100.");
      return;
    }

    try {
      setGradingSubmissionId(submissionId);
      await scoreMutation.mutateAsync({ submissionId, score });
    } catch {
      setGradingSubmissionId("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-3 pb-32 gap-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <Text className="text-base font-black text-slate-800">Chấm bài Assignment</Text>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            {selectedCourseTitle || "Chọn khóa học để bắt đầu chấm bài"}
          </Text>
        </View>

        {coursesQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : null}

        {coursesQuery.isError ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5">
            <Text className="text-sm font-bold text-red-700">Không tải được danh sách khóa học.</Text>
            <Text className="mt-1 text-xs font-medium text-red-600">
              Lỗi: {getErrorText(coursesQuery.error)}
            </Text>
          </View>
        ) : null}

        {!coursesQuery.isLoading && !coursesQuery.isError && !instructorCourses.length ? (
          <View className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
            <Text className="text-sm font-bold text-slate-700">
              Bạn chưa có khóa học nào để chấm assignment.
            </Text>
          </View>
        ) : null}

        {instructorCourses.length > 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Danh sách khóa học
            </Text>
            <FlatList
              data={instructorCourses}
              horizontal
              keyExtractor={(item, index) => String(item.id ?? `course-${index}`)}
              renderItem={({ item }) => {
                const courseId = String(item.id ?? "").trim();
                const isActive = courseId === selectedCourseId;

                return (
                  <CourseCard
                    course={item}
                    isActive={isActive}
                    onPress={() => {
                      if (!courseId) {
                        return;
                      }
                      setSelectedCourseId(courseId);
                    }}
                  />
                );
              }}
              showsHorizontalScrollIndicator={false}
              onEndReachedThreshold={0.4}
              onEndReached={handleLoadMoreCourses}
              ListFooterComponent={
                coursesQuery.isFetchingNextPage ? (
                  <View className="w-20 items-center justify-center">
                    <ActivityIndicator size="small" color="#7c3aed" />
                  </View>
                ) : null
              }
            />

            <Text className="mt-3 text-xs font-medium text-slate-500">
              Bấm vào card để chọn khóa học, sau đó chọn assignment cần chấm.
            </Text>
          </View>
        ) : null}

        {selectedCourseId.length === 0 && instructorCourses.length > 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
            <Text className="text-sm font-bold text-slate-700">
              Vui lòng chọn một khóa học từ card phía trên để xem assignment.
            </Text>
          </View>
        ) : null}

        {courseQuery.isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : null}

        {!courseQuery.isLoading && selectedCourseId.length > 0 && assignmentLessons.length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white px-4 py-5">
            <Text className="text-sm font-bold text-slate-700">
              Khoá học chưa có assignment lesson nào để chấm.
            </Text>
          </View>
        ) : null}

        {assignmentLessons.length > 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-3">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Chọn assignment
            </Text>
            <View className="gap-2">
              {assignmentLessons.map((item) => {
                const isActive = item.lessonId === selectedAssignmentId;
                return (
                  <Pressable
                    key={item.lessonId}
                    onPress={() => setSelectedAssignmentId(item.lessonId)}
                    className={`rounded-xl border px-3 py-2 ${
                      isActive
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Text className="text-sm font-bold text-slate-800">{item.lessonTitle}</Text>
                    <Text className="mt-0.5 text-xs font-medium text-slate-500">
                      {item.sectionTitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {selectedAssignmentId ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-black text-slate-800">Bài nộp của học viên</Text>
              {submissionsQuery.isFetching ? (
                <ActivityIndicator size="small" color="#7c3aed" />
              ) : null}
            </View>

            {submissions.length === 0 ? (
              <Text className="py-3 text-xs font-medium text-slate-500">
                Chưa có học viên nộp assignment này.
              </Text>
            ) : (
              <View className="gap-3">
                {submissions.map((submission) => {
                  const submissionId = String(submission.id ?? "").trim();
                  const userId = String(submission.userId ?? "").trim();
                  const studentName =
                    studentNameMap[userId] ?? "Học viên";
                  const currentScore =
                    scoreInputs[submissionId] ??
                    (submission.score != null ? String(submission.score) : "");
                  const isGrading =
                    scoreMutation.isPending && gradingSubmissionId === submissionId;

                  return (
                    <View
                      key={submissionId || `${submission.userId}-${submission.submissionTime}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <Text className="text-sm font-bold text-slate-800">
                        {studentName}
                      </Text>

                      <Text className="mt-1 text-[11px] font-semibold text-slate-500">
                        {formatDateTime(submission.submissionTime)}
                      </Text>

                      <Text className="mt-2 text-xs font-medium text-slate-600">
                        {submission.content?.trim() || "(Không có nội dung)"}
                      </Text>

                      {(submission.attachments?.length ?? 0) > 0 ? (
                        <View className="mt-2 gap-1">
                          {(submission.attachments ?? []).map((attachment, index) => {
                            const url = String(attachment.attachmentUrl ?? "").trim();
                            return (
                              <Pressable
                                key={`${submissionId}-att-${index}`}
                                onPress={() => {
                                  if (!url) {
                                    return;
                                  }

                                  void Linking.openURL(url);
                                }}
                              >
                                <Text className="text-xs font-semibold text-violet-700">
                                  • {attachment.fileName ?? "Tệp đính kèm"}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}

                      <View className="mt-3 flex-row items-center gap-2">
                        <TextInput
                          value={currentScore}
                          onChangeText={(value) => {
                            setScoreInputs((previous) => ({
                              ...previous,
                              [submissionId]: value,
                            }));
                          }}
                          placeholder="0 - 100"
                          keyboardType="numeric"
                          className="h-10 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-800"
                        />
                        <Pressable
                          onPress={() => {
                            void handleGradeSubmission(submissionId);
                          }}
                          disabled={isGrading || !submissionId}
                          className={`h-10 flex-1 items-center justify-center rounded-lg ${
                            isGrading ? "bg-violet-300" : "bg-violet-600"
                          }`}
                        >
                          {isGrading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text className="text-xs font-bold text-white">Chấm điểm</Text>
                          )}
                        </Pressable>
                      </View>

                      {submission.score != null ? (
                        <Text className="mt-2 text-[11px] font-bold text-emerald-700">
                          Điểm hiện tại: {submission.score}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
