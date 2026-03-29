import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactElement } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type CourseDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CourseDetail"
>;

export default function CourseDetailScreen({
  route,
  navigation,
}: CourseDetailScreenProps): ReactElement {
  const courseId = route.params?.courseId || "unknown";

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <Text className="text-2xl font-black text-slate-800">
            Chi tiết khóa học
          </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#334155" />
          </Pressable>
        </View>

        {/* Course Info */}
        <View className="mx-6 space-y-6">
          <View className="rounded-2xl bg-white/60 border border-white/50 p-6">
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Course ID
              </Text>
              <Text className="mt-1 text-xl font-black text-slate-900">
                {courseId}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Status
              </Text>
              <Text className="mt-1 rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-600 w-fit">
                In Development
              </Text>
            </View>

            <View>
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Description
              </Text>
              <Text className="mt-2 text-base font-medium text-slate-700">
                This is a placeholder screen. Full course details will be
                displayed here including syllabus, instructor info, lessons, and
                reviews.
              </Text>
            </View>
          </View>

          {/* Placeholder Sections */}
          <View className="rounded-2xl bg-white/60 border border-white/50 p-4">
            <Text className="text-sm font-bold text-slate-700 mb-3">
              Course Content (Coming Soon)
            </Text>
            <View className="space-y-2">
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="rounded-lg bg-slate-100 px-3 py-2 flex-row items-center gap-2"
                >
                  <Ionicons name="play-circle" size={16} color="#9333ea" />
                  <Text className="text-sm font-medium text-slate-600">
                    Lesson {i}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
