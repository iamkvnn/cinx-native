import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { CourseControllerService, OpenAPI } from "../../api/course";
import { CourseImageControllerService } from "../../api/course/services/CourseImageControllerService";
import { uploadFileToS3 } from "../../utils/uploadToS3";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuthStore } from "../../store/useAuthStore";

type CourseManagementRouteProp = RouteProp<RootStackParamList, "CourseManagement">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ensureToken() {
  const token = useAuthStore.getState().accessToken;
  if (token) OpenAPI.TOKEN = token;
}

export default function CourseManagementScreen() {
  const route = useRoute<CourseManagementRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const courseId = route.params.courseId;

  const { data: courseData, isLoading, refetch } = useQuery({
    queryKey: ["course-mgmt", courseId],
    queryFn: () => {
      ensureToken();
      return CourseControllerService.getCourseById({ id: courseId });
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(90);
  const [certificateTitle, setCertificateTitle] = useState("");
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  useEffect(() => {
    if (courseData?.data) {
      const d = courseData.data;
      setTitle(d.title || "");
      setDescription(d.description || "");
      setPrice(d.price?.toString() || "");
      setDuration(Math.min(Math.max(Number(d.duration) || 90, 90), 240));
      setCertificateTitle((d as any).certificateTitle || "");
      const imgs = (d as any).images;
      if (imgs && imgs.length > 0) {
        setThumbUrl(imgs[0].imageUrl ?? imgs[0].url ?? null);
      }
    }
  }, [courseData]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      ensureToken();

      const d = courseData?.data;
      const catId = (d as any)?.category?.id || (d as any)?.categoryId;

      // Extract sections to avoid NPE on backend
      const payloadSections = ((d as any)?.sections || []).map((sec: any) => ({
        id: sec.id,
        title: sec.title || "",
        description: sec.description || "",
        duration: sec.duration || 0,
        orderIndex: sec.orderIndex || 0,
        lessons: (sec.lessons || []).map((les: any) => ({
          id: les.id,
          title: les.title || "",
          duration: les.duration || 0,
          orderIndex: les.orderIndex || 0,
          lessonType: les.lessonType,
        })),
      }));

      await CourseControllerService.updateCourse({
        id: courseId,
        requestBody: {
          title,
          description,
          categoryId: catId,
          price: Number(price),
          discountedPrice: Number(price),
          duration,
          hasCertificate: certificateTitle.trim().length > 0,
          certificateTitle: certificateTitle.trim() || title,
          // Preserve existing publish state — do NOT reset to false
          isPublished: (d as any)?.isPublished ?? false,
          isInSubscription: (d as any)?.isInSubscription ?? false,
          sections: payloadSections,
        },
      });
      Alert.alert("Thành công", "Cập nhật khoá học thành công!");
      refetch();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Cập nhật thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadCourseImage = async (uri: string, name: string, mimeType: string) => {
    try {
      setIsUploadingImg(true);
      ensureToken();

      const uploaded = await uploadFileToS3(uri, name, mimeType);

      await CourseImageControllerService.uploadCourseImages({
        courseId,
        requestBody: {
          images: [{ fileKey: uploaded.fileKey }],
        },
      });

      Alert.alert("Thành công", "Upload ảnh thành công!");
      refetch();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Upload ảnh thất bại");
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      "Chọn ảnh",
      "Chọn nguồn ảnh bìa cho khoá học",
      [
        {
          text: "Thư viện ảnh",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Đã từ chối quyền", "Cần quyền truy cập thư viện ảnh.");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 1,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "image.jpg";
              const mimeType = asset.mimeType ?? "image/jpeg";
              handleUploadCourseImage(asset.uri, fileName, mimeType);
            }
          },
        },
        {
          text: "Quản lý file",
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: "image/*",
              copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets?.[0]) {
              const file = result.assets[0];
              handleUploadCourseImage(file.uri, file.name, file.mimeType ?? "image/jpeg");
            }
          },
        },
        { text: "Huỷ", style: "cancel" },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#7958ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

        <Text style={styles.label}>Ảnh bìa khoá học</Text>
        <Pressable
          style={styles.imagePicker}
          onPress={handlePickImage}
          disabled={isUploadingImg}
        >
          {isUploadingImg ? (
            <ActivityIndicator color="#7958ee" />
          ) : thumbUrl ? (
            <Image source={{ uri: thumbUrl }} style={styles.thumbImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#94a3b8" />
              <Text style={styles.imagePlaceholderText}>Nhấn để tải ảnh bìa khoá học</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.label}>Tên khoá học</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Tên khoá học" />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Mô tả khoá học"
        />

        <Text style={styles.label}>Giá (VND)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="500000"
        />

        {/* Duration Slider */}
        <Text style={styles.label}>
          Thời lượng: <Text style={styles.labelValue}>{duration} phút</Text>
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={90}
          maximumValue={240}
          step={5}
          value={duration}
          onValueChange={(v) => setDuration(Math.round(v))}
          minimumTrackTintColor="#7958ee"
          maximumTrackTintColor="#e2e8f0"
          thumbTintColor="#7958ee"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>90 phút</Text>
          <Text style={styles.sliderLabel}>240 phút</Text>
        </View>

        {/* Certificate */}
        <Text style={styles.label}>Tên chứng chỉ</Text>
        <TextInput
          style={styles.input}
          value={certificateTitle}
          onChangeText={setCertificateTitle}
          placeholder={title || "Chứng chỉ hoàn thành khoá học"}
        />

        <Pressable style={styles.submitButton} onPress={handleUpdate} disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
          )}
        </Pressable>
      </View>

      {/* Curriculum */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chương trình học</Text>
        <Text style={styles.descriptionText}>
          Quản lý các chương, bài học (video, quiz, bài viết, bài tập) và sắp xếp thứ tự.
        </Text>
        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate("CurriculumBuilder", { courseId })}
        >
          <Text style={styles.outlineButtonText}>Mở trình xây dựng →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingBottom: 60 },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 8, marginTop: 16 },
  labelValue: { color: "#7958ee" },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  imagePicker: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  thumbImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center", gap: 8 },
  imagePlaceholderText: { color: "#64748b", fontSize: 13, fontWeight: "500" },
  textArea: { height: 100, textAlignVertical: "top" },
  slider: { width: "100%", height: 40, marginTop: 4 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  sliderLabel: { color: "#94a3b8", fontSize: 12 },
  descriptionText: { color: "#64748b", marginBottom: 16, lineHeight: 20 },
  submitButton: {
    backgroundColor: "#7958ee",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  outlineButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#7958ee",
  },
  outlineButtonText: { color: "#7958ee", fontSize: 15, fontWeight: "bold" },
});
