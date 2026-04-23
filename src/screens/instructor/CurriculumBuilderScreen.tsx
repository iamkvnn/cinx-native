import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { CourseControllerService, OpenAPI } from "../../api/course";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../store/useAuthStore";
import LessonContentModal from "../../components/instructor/LessonContentModal";
import {
  getCourseLifecycleColor,
  getCourseLifecycleLabel,
  getCourseLifecycleStatus,
} from "../../utils/courseStatus";

type CurriculumBuilderRouteProp = RouteProp<RootStackParamList, "CurriculumBuilder">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LessonType = "VIDEO" | "ARTICLE" | "ASSIGNMENT" | "QUIZ";

interface LessonItem {
  id: string;
  title: string;
  lessonType: LessonType;
  orderIndex: number;
  duration?: number;
}

interface SectionItem {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: LessonItem[];
}

const LESSON_TYPE_ICONS: Record<LessonType, string> = {
  VIDEO: "videocam-outline",
  ARTICLE: "document-text-outline",
  ASSIGNMENT: "clipboard-outline",
  QUIZ: "help-circle-outline",
};

const LESSON_TYPE_COLORS: Record<LessonType, string> = {
  VIDEO: "#7958ee",
  ARTICLE: "#0ea5e9",
  ASSIGNMENT: "#f59e0b",
  QUIZ: "#10b981",
};

function ensureToken() {
  const token = useAuthStore.getState().accessToken;
  if (token) OpenAPI.TOKEN = token;
}

export default function CurriculumBuilderScreen() {
  const route = useRoute<CurriculumBuilderRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const courseId = route.params.courseId;

  const { data: courseData, isLoading, refetch } = useQuery({
    queryKey: ["course-curriculum", courseId],
    queryFn: () => {
      ensureToken();
      return CourseControllerService.getCourseById({ id: courseId });
    },
  });

  const [sections, setSections] = useState<SectionItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const courseStatus = getCourseLifecycleStatus(courseData?.data ?? {});

  // Section rename modal
  const [sectionModalVisible, setSectionModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [sectionTitleInput, setSectionTitleInput] = useState("");
  const [sectionDescInput, setSectionDescInput] = useState("");

  // Lesson rename modal
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [editingLessonSectionId, setEditingLessonSectionId] = useState("");
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [lessonTitleInput, setLessonTitleInput] = useState("");

  // Add lesson type picker
  const [addLessonPickerVisible, setAddLessonPickerVisible] = useState(false);
  const [addLessonTargetSectionId, setAddLessonTargetSectionId] = useState("");

  // Content modal (video/article/quiz/assignment)
  const [contentModalLesson, setContentModalLesson] = useState<LessonItem | null>(null);
  const [contentModalVisible, setContentModalVisible] = useState(false);

  useEffect(() => {
    if (courseData?.data?.sections) {
      // Sort sections AND their lessons by orderIndex from the API
      const sorted = [...(courseData.data.sections as SectionItem[])]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((sec) => ({
          ...sec,
          lessons: [...(sec.lessons ?? [])].sort(
            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
          ),
        }));
      setSections(sorted);
      setIsDirty(false);
    }
  }, [courseData]);

  // ── Sync structure to backend (PUT course) ──────────────────────────────────

  const handleSyncStructure = async () => {
    try {
      setIsSyncing(true);
      ensureToken();

      const payloadSections = sections.map((sec, secIndex) => ({
        id: sec.id?.startsWith("temp-") ? undefined : sec.id,
        title: sec.title,
        description: sec.description ?? "",
        duration: 0,
        orderIndex: secIndex,
        lessons: (sec.lessons || []).map((les, lesIndex) => ({
          id: les.id?.startsWith("temp-") ? undefined : les.id,
          title: les.title,
          lessonType: les.lessonType,
          duration: les.duration ?? 0,
          orderIndex: lesIndex,
        })),
      }));

      const d = courseData?.data;
      const catId = (d as any)?.category?.id || (d as any)?.categoryId;

      await CourseControllerService.updateCourse({
        id: courseId,
        requestBody: {
          title: d?.title,
          description: d?.description,
          categoryId: catId,
          price: d?.price,
          discountedPrice: d?.discountedPrice,
          duration: d?.duration,
          hasCertificate: d?.hasCertificate,
          certificateTitle: d?.certificateTitle,
          isPublished: (d as any)?.isPublished ?? false,
          isInSubscription: d?.isInSubscription,
          sections: payloadSections,
        },
      });

      Alert.alert("Đã lưu", "Cấu trúc khoá học đã được cập nhật.");
      setIsDirty(false);
      refetch();
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Cập nhật thất bại");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDone = () => {
    if (isDirty) {
      Alert.alert(
        "Thay đổi chưa lưu",
        "Bạn có thay đổi chưa lưu. Bạn muốn thoát mà không lưu?",
        [
          { text: "Ở lại", style: "cancel" },
          {
            text: "Thoát",
            style: "destructive",
            onPress: () => navigation.navigate("InstructorTabs", { screen: "MyCourses" }),
          },
        ]
      );
    } else {
      navigation.navigate("InstructorTabs", { screen: "MyCourses" });
    }
  };

  // ── Section CRUD ────────────────────────────────────────────────────────────

  const openAddSection = () => {
    setEditingSection(null);
    setSectionTitleInput("");
    setSectionDescInput("");
    setSectionModalVisible(true);
  };

  const openEditSection = (sec: SectionItem) => {
    setEditingSection(sec);
    setSectionTitleInput(sec.title);
    setSectionDescInput(sec.description ?? "");
    setSectionModalVisible(true);
  };

  const handleConfirmSection = () => {
    if (!sectionTitleInput.trim()) {
      Alert.alert("Error", "Section title cannot be empty");
      return;
    }
    if (editingSection) {
      // Edit
      setSections((prev) =>
        prev.map((s) =>
          s.id === editingSection.id
            ? { ...s, title: sectionTitleInput.trim(), description: sectionDescInput.trim() }
            : s
        )
      );
    } else {
      // Add
      const newSec: SectionItem = {
        id: `temp-${Date.now()}`,
        title: sectionTitleInput.trim(),
        description: sectionDescInput.trim(),
        orderIndex: sections.length,
        lessons: [],
      };
      setSections((prev) => [...prev, newSec]);
    }
    setIsDirty(true);
    setSectionModalVisible(false);
  };

  const handleDeleteSection = (secId: string) => {
    Alert.alert("Xoá chương", "Bạn có chắc muốn xoá chương này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: () => {
          setSections((prev) => prev.filter((s) => s.id !== secId));
          setIsDirty(true);
        },
      },
    ]);
  };

  // ── Lesson CRUD ─────────────────────────────────────────────────────────────

  const openAddLesson = (sectionId: string) => {
    setAddLessonTargetSectionId(sectionId);
    setAddLessonPickerVisible(true);
  };

  const handlePickLessonType = (type: LessonType) => {
    setAddLessonPickerVisible(false);
    const secIdx = sections.findIndex((s) => s.id === addLessonTargetSectionId);
    if (secIdx === -1) return;

    const newLesson: LessonItem = {
      id: `temp-${Date.now()}`,
      title: `New ${type} Lesson`,
      lessonType: type,
      orderIndex: sections[secIdx].lessons.length,
    };
    const updated = [...sections];
    updated[secIdx] = {
      ...updated[secIdx],
      lessons: [...updated[secIdx].lessons, newLesson],
    };
    setSections(updated);
    setIsDirty(true);
  };

  const openEditLesson = (sectionId: string, lesson: LessonItem) => {
    setEditingLessonSectionId(sectionId);
    setEditingLesson(lesson);
    setLessonTitleInput(lesson.title);
    setLessonModalVisible(true);
  };

  const handleConfirmLesson = () => {
    if (!lessonTitleInput.trim()) {
      Alert.alert("Lỗi", "Tên bài học không được để trống");
      return;
    }
    setSections((prev) =>
      prev.map((s) =>
        s.id === editingLessonSectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === editingLesson?.id ? { ...l, title: lessonTitleInput.trim() } : l
              ),
            }
          : s
      )
    );
    setIsDirty(true);
    setLessonModalVisible(false);
  };

  const handleDeleteLesson = (sectionId: string, lessonId: string) => {
    Alert.alert("Delete Lesson", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSections((prev) =>
            prev.map((s) =>
              s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s
            )
          );
          setIsDirty(true);
        },
      },
    ]);
  };

  const openContentModal = (lesson: LessonItem) => {
    if (lesson.id.startsWith("temp-")) {
      Alert.alert("Save First", "Please save the structure first before editing lesson content.");
      return;
    }
    setContentModalLesson(lesson);
    setContentModalVisible(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderSectionItem = ({ item, drag, isActive }: RenderItemParams<SectionItem>) => (
    <ScaleDecorator>
      <View style={[styles.sectionCard, isActive && styles.sectionCardActive]}>
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity onLongPress={drag} hitSlop={12}>
            <Ionicons name="reorder-three-outline" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.sectionTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.sectionActions}>
            <Pressable onPress={() => openEditSection(item)} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={16} color="#64748b" />
            </Pressable>
            <Pressable onPress={() => handleDeleteSection(item.id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        {/* Lessons — nested DraggableFlatList for reordering */}
        <View style={styles.lessonsContainer}>
          <DraggableFlatList
            data={item.lessons}
            keyExtractor={(lesson) => lesson.id}
            onDragEnd={({ data: reordered }) => {
              setSections((prev) =>
                prev.map((s) =>
                  s.id === item.id ? { ...s, lessons: reordered } : s
                )
              );
              setIsDirty(true);
            }}
            scrollEnabled={false}
            renderItem={({ item: lesson, drag: lessonDrag, isActive: lessonActive }) => {
              const color = LESSON_TYPE_COLORS[lesson.lessonType];
              const icon = LESSON_TYPE_ICONS[lesson.lessonType];
              const isTemp = lesson.id.startsWith("temp-");
              return (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={lessonDrag}
                    disabled={lessonActive}
                    activeOpacity={1}
                    style={[
                      styles.lessonCard,
                      lessonActive && { opacity: 0.85, backgroundColor: "#f1f5f9" },
                    ]}
                  >
                    <View style={[styles.lessonTypeBar, { backgroundColor: color }]} />
                    <View style={styles.lessonCardInner}>
                      <Ionicons name="reorder-two-outline" size={16} color="#cbd5e1" />
                      <View style={styles.lessonLeft}>
                        <Ionicons name={icon as any} size={16} color={color} />
                        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                        {isTemp && <Text style={styles.tempBadge}>unsaved</Text>}
                      </View>
                      <View style={styles.lessonActions}>
                        {!isTemp && (
                          <Pressable onPress={() => openContentModal(lesson)} style={styles.actionBtn}>
                            <Ionicons name="create-outline" size={16} color="#7958ee" />
                          </Pressable>
                        )}
                        <Pressable onPress={() => openEditLesson(item.id, lesson)} style={styles.actionBtn}>
                          <Ionicons name="pencil-outline" size={16} color="#64748b" />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteLesson(item.id, lesson.id)} style={styles.actionBtn}>
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              );
            }}
          />
          <Pressable style={styles.addLessonBtn} onPress={() => openAddLesson(item.id)}>
            <Ionicons name="add" size={16} color="#7958ee" />
            <Text style={styles.addLessonText}>Add Lesson</Text>
          </Pressable>
        </View>
      </View>
    </ScaleDecorator>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#7958ee" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View
          style={[
            styles.statusBanner,
            {
              borderColor: `${getCourseLifecycleColor(courseData?.data ?? {})}33`,
              backgroundColor: `${getCourseLifecycleColor(courseData?.data ?? {})}12`,
            },
          ]}
        >
          <Text
            style={[
              styles.statusBannerLabel,
              { color: getCourseLifecycleColor(courseData?.data ?? {}) },
            ]}
          >
            Trạng thái: {getCourseLifecycleLabel(courseData?.data ?? {})}
          </Text>
          <Text style={styles.statusBannerText}>
            {courseStatus === "PUBLISHED"
              ? "Khóa học đang công khai. Khi lưu thay đổi nội dung, hệ thống sẽ đẩy lại luồng duyệt."
              : courseStatus === "WAITING_APPROVAL"
                ? "Khóa học đang chờ duyệt, bạn vẫn có thể tiếp tục chỉnh sửa trước khi admin quyết định."
                : courseStatus === "REJECTED"
                  ? "Khóa học bị từ chối. Hãy sửa nội dung rồi gửi lại để duyệt."
                  : "Đây là bản nháp, bạn có thể chỉnh sửa bình thường."}
          </Text>
        </View>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topBarTitle}>Chương trình học</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              style={[styles.syncBtn, !isDirty && styles.syncBtnDisabled]}
              onPress={handleSyncStructure}
              disabled={isSyncing || !isDirty}
            >
              {isSyncing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.syncBtnText}>
                  {isDirty
                    ? courseStatus === "PUBLISHED"
                      ? "⬆ Lưu & gửi duyệt"
                      : "⬆ Lưu"
                    : "Đã lưu ✓"}
                </Text>
              )}
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>Hoàn thành</Text>
            </Pressable>
          </View>
        </View>

        <DraggableFlatList
          data={sections}
          onDragEnd={({ data }) => {
            setSections(data);
            setIsDirty(true);
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderSectionItem}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <Pressable style={styles.addSectionBtn} onPress={openAddSection}>
              <Ionicons name="add-circle-outline" size={22} color="#7958ee" />
              <Text style={styles.addSectionText}>Thêm chương</Text>
            </Pressable>
          }
        />

        {/* ── Section Modal ──────────────────────────────────── */}
        <Modal visible={sectionModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>
                {editingSection ? "Chỉnh sửa chương" : "Chương mới"}
              </Text>
              <Text style={styles.modalLabel}>Tên chương *</Text>
              <TextInput
                style={styles.modalInput}
                value={sectionTitleInput}
                onChangeText={setSectionTitleInput}
                placeholder="Tên chương"
                autoFocus
              />
              <Text style={styles.modalLabel}>Mô tả</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
                value={sectionDescInput}
                onChangeText={setSectionDescInput}
                placeholder="Mô tả (tuỳ chọn)"
                multiline
              />
              <View style={styles.modalBtns}>
                <Pressable style={styles.cancelBtn} onPress={() => setSectionModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Huỷ</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={handleConfirmSection}>
                  <Text style={styles.confirmBtnText}>
                    {editingSection ? "Cập nhật" : "Thêm"}
                  </Text>
                </Pressable>
              </View>
            </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Lesson Rename Modal ────────────────────────────── */}
        <Modal visible={lessonModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Đổi tên bài học</Text>
              <Text style={styles.modalLabel}>Tên bài học *</Text>
              <TextInput
                style={styles.modalInput}
                value={lessonTitleInput}
                onChangeText={setLessonTitleInput}
                placeholder="Tên bài học"
                autoFocus
              />
              <View style={styles.modalBtns}>
                <Pressable style={styles.cancelBtn} onPress={() => setLessonModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Huỷ</Text>
                </Pressable>
                <Pressable style={styles.confirmBtn} onPress={handleConfirmLesson}>
                  <Text style={styles.confirmBtnText}>Cập nhật</Text>
                </Pressable>
              </View>
            </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Add Lesson Type Picker ─────────────────────────── */}
        <Modal visible={addLessonPickerVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Chọn loại bài học</Text>
              {(["VIDEO", "ARTICLE", "ASSIGNMENT", "QUIZ"] as LessonType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[styles.typePickerBtn, { borderLeftColor: LESSON_TYPE_COLORS[type] }]}
                  onPress={() => handlePickLessonType(type)}
                >
                  <Ionicons name={LESSON_TYPE_ICONS[type] as any} size={22} color={LESSON_TYPE_COLORS[type]} />
                  <Text style={[styles.typePickerText, { color: LESSON_TYPE_COLORS[type] }]}>{type}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.cancelBtn, { marginTop: 4 }]}
                onPress={() => setAddLessonPickerVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Huỷ</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ── Lesson Content Modal ───────────────────────────── */}
        {contentModalLesson && (
          <LessonContentModal
            visible={contentModalVisible}
            lessonId={contentModalLesson.id}
            lessonType={contentModalLesson.lessonType}
            lessonTitle={contentModalLesson.title}
            onClose={() => setContentModalVisible(false)}
            onSaved={() => setContentModalVisible(false)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  statusBannerLabel: { fontSize: 13, fontWeight: "800" },
  statusBannerText: { marginTop: 4, fontSize: 12, lineHeight: 18, color: "#475569" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  topBarTitle: { fontSize: 17, fontWeight: "bold", color: "#0f172a" },
  syncBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnDisabled: { backgroundColor: "#a3a3a3" },
  syncBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  doneBtn: {
    backgroundColor: "#7958ee",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  listContent: { padding: 16, paddingBottom: 120 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  sectionCardActive: { backgroundColor: "#f1f5f9", opacity: 0.9 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 10,
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#0f172a" },
  sectionActions: { flexDirection: "row", gap: 4 },

  lessonsContainer: { padding: 12, gap: 8 },

  lessonCard: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fafafa",
  },
  lessonTypeBar: { width: 4 },
  lessonCardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  lessonLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  lessonTitle: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "500" },
  tempBadge: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "700",
    backgroundColor: "#fef9c3",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lessonActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },

  addLessonBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  addLessonText: { color: "#7958ee", fontWeight: "600", fontSize: 13 },

  addSectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#c4b5fd",
    borderRadius: 14,
    marginTop: 4,
  },
  addSectionText: { color: "#7958ee", fontWeight: "700", fontSize: 15 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    margin: 0,
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 6, marginTop: 12 },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  cancelBtnText: { color: "#64748b", fontWeight: "600" },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#7958ee",
  },
  confirmBtnText: { color: "#fff", fontWeight: "700" },

  typePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  typePickerText: { fontSize: 15, fontWeight: "700" },
});
