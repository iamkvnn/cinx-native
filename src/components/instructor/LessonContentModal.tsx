import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { OpenAPI } from "../../api/course";
import { VideoLessonControllerService } from "../../api/course/services/VideoLessonControllerService";
import { ArticleLessonControllerService } from "../../api/course/services/ArticleLessonControllerService";
import { AssignmentLessonControllerService } from "../../api/course/services/AssignmentLessonControllerService";
import { QuizLessonControllerService } from "../../api/course/services/QuizLessonControllerService";
import { uploadFileToS3 } from "../../utils/uploadToS3";
import { useAuthStore } from "../../store/useAuthStore";

type LessonType = "VIDEO" | "ARTICLE" | "ASSIGNMENT" | "QUIZ";

interface Props {
  visible: boolean;
  lessonId: string;
  lessonType: LessonType;
  lessonTitle: string;
  onClose: () => void;
  onSaved: () => void;
}

function ensureToken() {
  const token = useAuthStore.getState().accessToken;
  if (token) OpenAPI.TOKEN = token;
}

// ─── Video Lesson Form ────────────────────────────────────────────────────────

function VideoForm({ lessonId, onSaved }: { lessonId: string; onSaved: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [existingFileName, setExistingFileName] = useState("");
  const [existingFileKey, setExistingFileKey] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const player = useVideoPlayer(videoUrl ?? "", (p) => {
    p.loop = false;
  });

  useEffect(() => {
    ensureToken();
    VideoLessonControllerService.getVideoByLessonId({ lessonId })
      .then((res) => {
        const data = res.data as any;
        if (data?.fileName) setExistingFileName(data.fileName);
        if (data?.fileKey) setExistingFileKey(data.fileKey);
        if (data?.videoUrl) setVideoUrl(data.videoUrl);
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [lessonId]);

  const handleUploadVideo = async (uri: string, name: string, mimeType: string) => {
    try {
      setIsUploading(true);
      ensureToken();

      const uploaded = await uploadFileToS3(uri, name, mimeType);

      const method = existingFileKey
        ? VideoLessonControllerService.updateVideoLesson
        : VideoLessonControllerService.createVideoLesson;

      await method({
        lessonId,
        requestBody: {
          fileKey: uploaded.fileKey,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
          duration: 0,
        },
      });

      setExistingFileName(uploaded.fileName);
      setExistingFileKey(uploaded.fileKey);
      // Re-fetch to get the actual videoUrl from server
      VideoLessonControllerService.getVideoByLessonId({ lessonId })
        .then((res) => {
          const data = res.data as any;
          if (data?.videoUrl) setVideoUrl(data.videoUrl);
        })
        .catch(() => {});
      Alert.alert("Success", "Video uploaded successfully!");
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickVideo = () => {
    Alert.alert(
      "Select Video Source",
      "Choose where to upload your video from",
      [
        {
          text: "Video Library",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission Denied", "Camera roll permissions are required to select videos.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "video.mp4";
              const mimeType = asset.mimeType ?? "video/mp4";
              handleUploadVideo(asset.uri, fileName, mimeType);
            }
          },
        },
        {
          text: "Files",
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: "video/*",
              copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.[0]) {
              const file = result.assets[0];
              handleUploadVideo(file.uri, file.name, file.mimeType ?? "video/mp4");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  if (isFetching) {
    return (
      <View style={formStyles.container}>
        <ActivityIndicator color="#7958ee" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={formStyles.container}>
      {/* Video Player if video exists */}
      {videoUrl ? (
        <View style={formStyles.videoPlayerWrapper}>
          <VideoView
            player={player}
            style={formStyles.videoPlayer}
            allowsFullscreen
            allowsPictureInPicture
          />
          <View style={formStyles.videoInfo}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={formStyles.existingText} numberOfLines={1}>{existingFileName}</Text>
          </View>
        </View>
      ) : existingFileName ? (
        <View style={formStyles.existingBox}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={formStyles.existingText} numberOfLines={1}>{existingFileName}</Text>
        </View>
      ) : null}

      <Text style={formStyles.label}>{existingFileName ? "Replace Video" : "Upload Video"}</Text>
      <Pressable
        style={[formStyles.uploadBox, isUploading && { opacity: 0.6 }]}
        onPress={handlePickVideo}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#7958ee" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={32} color="#7958ee" />
            <Text style={formStyles.uploadText}>
              {existingFileName ? "Tap to replace video" : "Tap to pick a video file"}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// ─── Article Lesson Form ──────────────────────────────────────────────────────

function ArticleForm({ lessonId, onSaved }: { lessonId: string; onSaved: () => void }) {
  const [content, setContent] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    ensureToken();
    ArticleLessonControllerService.getArticleByLessonId({ lessonId })
      .then((res) => {
        const data = res.data as any;
        if (data?.content) {
          setContent(data.content);
          setHasExisting(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [lessonId]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Content cannot be empty");
      return;
    }
    try {
      setIsSaving(true);
      ensureToken();
      if (hasExisting) {
        await ArticleLessonControllerService.updateArticleLesson({ lessonId, requestBody: { content } });
      } else {
        await ArticleLessonControllerService.createArticleLesson({ lessonId, requestBody: { content } });
      }
      setHasExisting(true);
      Alert.alert("Saved", "Article saved successfully!");
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <ActivityIndicator color="#7958ee" style={{ marginTop: 24 }} />;
  }

  return (
    <View style={formStyles.container}>
      {hasExisting && (
        <View style={formStyles.existingBox}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[formStyles.existingText, { color: "#10b981" }]}>Article already saved — editing</Text>
        </View>
      )}
      <Text style={formStyles.label}>Article Content (HTML / Markdown)</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        multiline
        numberOfLines={10}
        placeholder="Write your article content here..."
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />
      <Pressable style={formStyles.saveBtn} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Article</Text>}
      </Pressable>
    </View>
  );
}

// ─── Assignment Lesson Form ───────────────────────────────────────────────────

function AssignmentForm({ lessonId, onSaved }: { lessonId: string; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentKey, setAttachmentKey] = useState("");
  const [attachmentType, setAttachmentType] = useState("");
  const [attachmentSize, setAttachmentSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    ensureToken();
    AssignmentLessonControllerService.getAssigmentByLessonId({ lessonId })
      .then((res) => {
        const data = res.data as any;
        if (data?.description) {
          setDescription(data.description);
          setHasExisting(true);
        }
        if (data?.attachments?.[0]) {
          const att = data.attachments[0];
          setAttachmentKey(att.fileKey ?? "");
          setAttachmentName(att.fileName ?? "");
          setAttachmentType(att.fileType ?? "");
          setAttachmentSize(att.fileSize ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [lessonId]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setIsUploading(true);
      ensureToken();
      const uploaded = await uploadFileToS3(file.uri, file.name, file.mimeType ?? "application/octet-stream");
      setAttachmentKey(uploaded.fileKey);
      setAttachmentName(uploaded.fileName);
      setAttachmentType(uploaded.fileType);
      setAttachmentSize(uploaded.fileSize);
      Alert.alert("Uploaded", `${uploaded.fileName} uploaded!`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }
    try {
      setIsSaving(true);
      ensureToken();
      const payload = {
        lessonId,
        requestBody: {
          description,
          attachments: attachmentKey
            ? [{ fileKey: attachmentKey, fileName: attachmentName, fileType: attachmentType, fileSize: attachmentSize }]
            : [],
        },
      };
      if (hasExisting) {
        await AssignmentLessonControllerService.updateAssigmentLesson(payload);
      } else {
        await AssignmentLessonControllerService.createAssigmentLesson(payload);
      }
      setHasExisting(true);
      Alert.alert("Saved", "Assignment saved!");
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <ActivityIndicator color="#7958ee" style={{ marginTop: 24 }} />;
  }

  return (
    <View style={formStyles.container}>
      {hasExisting && (
        <View style={formStyles.existingBox}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[formStyles.existingText, { color: "#10b981" }]}>Assignment saved — editing</Text>
        </View>
      )}
      <Text style={formStyles.label}>Description</Text>
      <TextInput
        style={[formStyles.input, formStyles.textArea]}
        multiline
        numberOfLines={4}
        placeholder="Assignment instructions..."
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />
      <Text style={formStyles.label}>Attachment</Text>
      {attachmentName ? (
        <View style={formStyles.existingBox}>
          <Ionicons name="attach" size={16} color="#7958ee" />
          <Text style={formStyles.existingText} numberOfLines={1}>{attachmentName}</Text>
        </View>
      ) : null}
      <Pressable
        style={[formStyles.uploadBox, isUploading && { opacity: 0.6 }]}
        onPress={handlePickFile}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#7958ee" />
        ) : (
          <>
            <Ionicons name="attach-outline" size={28} color="#7958ee" />
            <Text style={formStyles.uploadText}>{attachmentName ? "Replace file" : "Tap to attach a file"}</Text>
          </>
        )}
      </Pressable>
      <Pressable style={formStyles.saveBtn} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Assignment</Text>}
      </Pressable>
    </View>
  );
}

// ─── Quiz Lesson Form ─────────────────────────────────────────────────────────

interface QuizOption {
  optionText: string;
  isCorrect: boolean;
}
interface QuizQuestion {
  questionText: string;
  options: QuizOption[];
}

const parseQuizDateTime = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatQuizDateTimeForApi = (value: Date | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  const seconds = `${value.getSeconds()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const formatQuizDateTimeForDisplay = (value: Date | null): string => {
  if (!value) {
    return "Chọn ngày và giờ";
  }

  return value.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function QuizForm({ lessonId, onSaved }: { lessonId: string; onSaved: () => void }) {
  const [maxAttempt, setMaxAttempt] = useState("3");
  const [duration, setDuration] = useState("30");
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(
    null,
  );
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [pickerWorkingDate, setPickerWorkingDate] = useState(new Date());
  const [pickerVisible, setPickerVisible] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { questionText: "", options: [{ optionText: "", isCorrect: false }, { optionText: "", isCorrect: false }] },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    ensureToken();
    QuizLessonControllerService.getQuizByLessonId({ lessonId })
      .then((res) => {
        const data = res.data as any;
        if (data) {
          if (data.maxAttempt) setMaxAttempt(String(data.maxAttempt));
          if (data.duration) setDuration(String(data.duration));
          setStartDateTime(parseQuizDateTime(data.startTime));
          setEndDateTime(parseQuizDateTime(data.endTime));
          if (data.questions?.length) {
            setQuestions(
              data.questions.map((q: any) => ({
                questionText: q.questionText ?? "",
                options: (q.options ?? []).map((o: any) => ({
                  optionText: o.optionText ?? "",
                  isCorrect: o.isCorrect ?? false,
                })),
              }))
            );
            setHasExisting(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [lessonId]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", options: [{ optionText: "", isCorrect: false }, { optionText: "", isCorrect: false }] },
    ]);
  };

  const updateQuestionText = (qi: number, text: string) => {
    const updated = [...questions];
    updated[qi] = { ...updated[qi], questionText: text };
    setQuestions(updated);
  };

  const updateOptionText = (qi: number, oi: number, text: string) => {
    const updated = [...questions];
    updated[qi].options[oi] = { ...updated[qi].options[oi], optionText: text };
    setQuestions(updated);
  };

  const setCorrectOption = (qi: number, oi: number) => {
    const updated = [...questions];
    updated[qi].options = updated[qi].options.map((opt, idx) => ({ ...opt, isCorrect: idx === oi }));
    setQuestions(updated);
  };

  const addOption = (qi: number) => {
    const updated = [...questions];
    updated[qi].options.push({ optionText: "", isCorrect: false });
    setQuestions(updated);
  };

  const openDateTimePicker = (target: "start" | "end") => {
    const initialValue =
      target === "start" ? startDateTime ?? new Date() : endDateTime ?? new Date();

    setPickerTarget(target);
    setPickerMode("date");
    setPickerWorkingDate(initialValue);
    setPickerVisible(true);
  };

  const applyPickedDateTime = (value: Date) => {
    if (pickerTarget === "start") {
      setStartDateTime(value);
      return;
    }

    if (pickerTarget === "end") {
      setEndDateTime(value);
    }
  };

  const handleDateTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === "dismissed") {
      setPickerVisible(false);
      setPickerMode("date");
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (pickerMode === "date") {
      setPickerWorkingDate(selectedDate);
      setPickerMode("time");
      return;
    }

    const merged = new Date(pickerWorkingDate);
    merged.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    applyPickedDateTime(merged);
    setPickerVisible(false);
    setPickerMode("date");
  };

  const handleSave = async () => {
    try {
      if (startDateTime && endDateTime && endDateTime <= startDateTime) {
        Alert.alert("Lỗi", "Thời gian kết thúc phải sau thời gian bắt đầu.");
        return;
      }

      setIsSaving(true);
      ensureToken();
      const payload = {
        lessonId,
        requestBody: {
          maxAttempt: parseInt(maxAttempt) || 3,
          duration: parseInt(duration) || 30,
          startTime: formatQuizDateTimeForApi(startDateTime),
          endTime: formatQuizDateTimeForApi(endDateTime),
          isReviewAllowed: true,
          isShowAnswersOnReview: true,
          numberOfQuestionPerQuizSession: questions.length,
          questions: questions.map((q, qi) => ({
            questionText: q.questionText,
            questionType: "SINGLE_CHOICE" as any,
            orderIndex: qi,
            options: q.options.map((o, oi) => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              optionOrder: oi,
            })),
          })),
        },
      };
      if (hasExisting) {
        await QuizLessonControllerService.updateQuizLesson(payload);
      } else {
        await QuizLessonControllerService.createQuizLesson(payload);
      }
      setHasExisting(true);
      Alert.alert("Saved", "Quiz saved!");
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <ActivityIndicator color="#7958ee" style={{ marginTop: 24 }} />;
  }

  return (
    <View style={formStyles.container}>
      {hasExisting && (
        <View style={formStyles.existingBox}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[formStyles.existingText, { color: "#10b981" }]}>Quiz saved — editing</Text>
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={formStyles.label}>Max Attempts</Text>
          <TextInput style={formStyles.input} keyboardType="numeric" value={maxAttempt} onChangeText={setMaxAttempt} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={formStyles.label}>Duration (mins)</Text>
          <TextInput style={formStyles.input} keyboardType="numeric" value={duration} onChangeText={setDuration} />
        </View>
      </View>

      <Text style={[formStyles.label, { marginTop: 16 }]}>Start Time</Text>
      <View style={formStyles.dateTimeRow}>
        <Pressable
          style={[formStyles.input, formStyles.dateTimeButton]}
          onPress={() => openDateTimePicker("start")}
        >
          <Text style={formStyles.dateTimeText}>
            {formatQuizDateTimeForDisplay(startDateTime)}
          </Text>
        </Pressable>
        <Pressable
          style={formStyles.dateTimeClearButton}
          onPress={() => setStartDateTime(null)}
        >
          <Ionicons name="close-circle" size={20} color="#64748b" />
        </Pressable>
      </View>

      <Text style={[formStyles.label, { marginTop: 12 }]}>End Time</Text>
      <View style={formStyles.dateTimeRow}>
        <Pressable
          style={[formStyles.input, formStyles.dateTimeButton]}
          onPress={() => openDateTimePicker("end")}
        >
          <Text style={formStyles.dateTimeText}>
            {formatQuizDateTimeForDisplay(endDateTime)}
          </Text>
        </Pressable>
        <Pressable
          style={formStyles.dateTimeClearButton}
          onPress={() => setEndDateTime(null)}
        >
          <Ionicons name="close-circle" size={20} color="#64748b" />
        </Pressable>
      </View>

      {pickerVisible ? (
        <View style={{ marginTop: 10 }}>
          <DateTimePicker
            value={pickerWorkingDate}
            mode={pickerMode}
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateTimeChange}
          />
          <Text style={formStyles.pickerHint}>
            {pickerMode === "date"
              ? "Bước 1/2: Chọn ngày"
              : "Bước 2/2: Chọn giờ"}
          </Text>
        </View>
      ) : null}

      <Text style={[formStyles.label, { marginTop: 16 }]}>Questions</Text>
      {questions.map((q, qi) => (
        <View key={qi} style={formStyles.questionCard}>
          <Text style={formStyles.questionNum}>Q{qi + 1}</Text>
          <TextInput
            style={formStyles.input}
            placeholder="Question text"
            value={q.questionText}
            onChangeText={(t) => updateQuestionText(qi, t)}
          />
          <Text style={[formStyles.label, { fontSize: 12, marginTop: 8 }]}>Options (tap ○ to mark correct)</Text>
          {q.options.map((opt, oi) => (
            <View key={oi} style={formStyles.optionRow}>
              <Pressable onPress={() => setCorrectOption(qi, oi)} style={formStyles.radio}>
                {opt.isCorrect && <View style={formStyles.radioDot} />}
              </Pressable>
              <TextInput
                style={[formStyles.input, { flex: 1 }]}
                placeholder={`Option ${oi + 1}`}
                value={opt.optionText}
                onChangeText={(t) => updateOptionText(qi, oi, t)}
              />
            </View>
          ))}
          <Pressable onPress={() => addOption(qi)} style={formStyles.addOptBtn}>
            <Ionicons name="add" size={14} color="#7958ee" />
            <Text style={formStyles.addOptText}>Add option</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={formStyles.addQuestionBtn} onPress={addQuestion}>
        <Ionicons name="add-circle-outline" size={20} color="#7958ee" />
        <Text style={formStyles.addOptText}>Add Question</Text>
      </Pressable>

      <Pressable style={formStyles.saveBtn} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Quiz</Text>}
      </Pressable>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const LESSON_TYPE_COLORS: Record<LessonType, string> = {
  VIDEO: "#7958ee",
  ARTICLE: "#0ea5e9",
  ASSIGNMENT: "#f59e0b",
  QUIZ: "#10b981",
};

export default function LessonContentModal({ visible, lessonId, lessonType, lessonTitle, onClose, onSaved }: Props) {
  const color = LESSON_TYPE_COLORS[lessonType] ?? "#7958ee";

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={[styles.sheetHeader, { borderBottomColor: color }]}>
            <View>
              <Text style={[styles.sheetType, { color }]}>{lessonType}</Text>
              <Text style={styles.sheetTitle}>{lessonTitle}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {visible && lessonType === "VIDEO" && <VideoForm lessonId={lessonId} onSaved={onSaved} />}
            {visible && lessonType === "ARTICLE" && <ArticleForm lessonId={lessonId} onSaved={onSaved} />}
            {visible && lessonType === "ASSIGNMENT" && <AssignmentForm lessonId={lessonId} onSaved={onSaved} />}
            {visible && lessonType === "QUIZ" && <QuizForm lessonId={lessonId} onSaved={onSaved} />}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 2,
  },
  sheetType: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  closeBtn: { padding: 4 },
});

const formStyles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateTimeButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  dateTimeText: {
    fontSize: 14,
    color: "#0f172a",
  },
  dateTimeClearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#c4b5fd",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#faf5ff",
    gap: 8,
    marginTop: 8,
  },
  uploadText: { color: "#7958ee", fontWeight: "600", fontSize: 14, textAlign: "center" },
  existingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  existingText: { flex: 1, fontSize: 13, color: "#166534", fontWeight: "500" },
  saveBtn: {
    backgroundColor: "#7958ee",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  questionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  questionNum: { fontSize: 12, fontWeight: "700", color: "#7958ee", marginBottom: 6 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#7958ee",
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#7958ee" },
  addOptBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, paddingLeft: 2 },
  addOptText: { color: "#7958ee", fontSize: 13, fontWeight: "600" },
  addQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderRadius: 8,
    marginTop: 4,
  },
  videoPlayerWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    backgroundColor: "#000",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
  },
  videoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#bbf7d0",
  },
});
