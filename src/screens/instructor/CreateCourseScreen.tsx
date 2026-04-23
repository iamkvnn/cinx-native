import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/useAuthStore";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CategoryControllerService } from "@/services/api/CategoryControllerService";
import { CourseControllerService } from "@/services/api/CourseControllerService";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CreateCourseScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(90); // minutes
  const [certificateTitle, setCertificateTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoryControllerService.getAllCategories(),
  });

  const categories = categoriesData?.data || [];

  const handleCreate = async () => {
    if (!title || !categoryId || !price) {
      Alert.alert("Error", "Please fill in title, category, and price.");
      return;
    }

    try {
      setIsCreating(true);

      const body = {
        title,
        description,
        categoryId,
        price: Number(price),
        discountedPrice: Number(price),
        isPublished: false,
        isInSubscription: false,
        duration: duration,
        hasCertificate: certificateTitle.trim().length > 0,
        certificateTitle: certificateTitle.trim() || title,
        sections: [
          {
            title: "Section 1: Introduction",
            description: "Welcome to the course",
            duration: 0,
            orderIndex: 0,
            lessons: [
              { title: "Video Lesson", duration: 0, orderIndex: 0, lessonType: "VIDEO" as const },
              { title: "Assignment Lesson", duration: 0, orderIndex: 1, lessonType: "ASSIGNMENT" as const },
              { title: "Quiz Lesson", duration: 0, orderIndex: 2, lessonType: "QUIZ" as const },
              { title: "Article Lesson", duration: 0, orderIndex: 3, lessonType: "ARTICLE" as const },
            ],
          },
          {
            title: "Section 2: Deep Dive",
            description: "Advanced topics",
            duration: 0,
            orderIndex: 1,
            lessons: [
              { title: "Video Lesson", duration: 0, orderIndex: 0, lessonType: "VIDEO" as const },
              { title: "Assignment Lesson", duration: 0, orderIndex: 1, lessonType: "ASSIGNMENT" as const },
              { title: "Quiz Lesson", duration: 0, orderIndex: 2, lessonType: "QUIZ" as const },
              { title: "Article Lesson", duration: 0, orderIndex: 3, lessonType: "ARTICLE" as const },
            ],
          },
        ],
      };

      console.log("--- Create Course API Call ---");
      console.log("Endpoint: POST /api/v1/courses");
      console.log("Body:", JSON.stringify(body, null, 2));

      const res = await CourseControllerService.createCourse({ requestBody: body });

      Alert.alert("Success", "Course created successfully!", [
        {
          text: "Go to Course",
          onPress: () => navigation.replace("CourseManagement", { courseId: res.data?.id || "" }),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Course Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="E.g. Advanced React Native"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Course description..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.categoryChip, categoryId === cat.id && styles.categoryChipSelected]}
            onPress={() => setCategoryId(cat.id || "")}
          >
            <Text style={[styles.categoryChipText, categoryId === cat.id && styles.categoryChipTextSelected]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Price (VND) *</Text>
      <TextInput
        style={styles.input}
        placeholder="E.g. 500000"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      {/* Duration Slider */}
      <Text style={styles.label}>Course Duration: <Text style={styles.labelValue}>{duration} minutes</Text></Text>
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
        <Text style={styles.sliderLabel}>90 min</Text>
        <Text style={styles.sliderLabel}>240 min</Text>
      </View>

      {/* Certificate */}
      <Text style={styles.label}>Certificate Title (leave blank to use course title)</Text>
      <TextInput
        style={styles.input}
        placeholder={title || "Certificate of Completion"}
        value={certificateTitle}
        onChangeText={setCertificateTitle}
      />

      <Pressable style={styles.submitButton} onPress={handleCreate} disabled={isCreating}>
        {isCreating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Course</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 8, marginTop: 20 },
  labelValue: { color: "#7958ee" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  categoryContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  categoryChipSelected: { backgroundColor: "#7958ee" },
  categoryChipText: { color: "#475569", fontWeight: "500", fontSize: 13 },
  categoryChipTextSelected: { color: "#fff" },
  slider: { width: "100%", height: 40 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
  sliderLabel: { color: "#94a3b8", fontSize: 12 },
  submitButton: {
    backgroundColor: "#7958ee",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 32,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
