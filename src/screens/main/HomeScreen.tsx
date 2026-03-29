import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchHomeDashboardMock } from "../../services/api/homeApi";
import type {
  ContinueLearningItem,
  RecommendationItem,
} from "../../types/home";

function ContinueLearningCard({
  item,
}: {
  item: ContinueLearningItem;
}): ReactElement {
  return (
    <View
      style={styles.glassCard}
      className="mr-4 w-[260px] rounded-[28px] p-4"
    >
      <View className="mb-3 flex-row items-start justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/75">
          <Ionicons name={item.iconName} size={21} color="#6366f1" />
        </View>
        <Text className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-slate-600">
          {item.remainingTime}
        </Text>
      </View>

      <Text className="mb-1 text-base font-bold text-slate-800">
        {item.title}
      </Text>
      <Text className="mb-4 text-xs text-slate-500">{item.chapter}</Text>

      <View className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            width: `${item.progressPercent}%`,
            height: 8,
            borderRadius: 999,
          }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-[10px] font-bold text-slate-400">
          {item.progressPercent}% Hoàn thành
        </Text>
        <Text className="text-[10px] font-bold text-violet-500">Tiếp tục</Text>
      </View>
    </View>
  );
}

function RecommendationCard({
  item,
}: {
  item: RecommendationItem;
}): ReactElement {
  return (
    <View
      style={styles.glassCard}
      className="mb-4 flex-row items-center gap-4 rounded-[28px] p-3"
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="h-20 w-20 rounded-2xl"
        resizeMode="cover"
      />

      <View className="flex-1 pr-2">
        <View className="mb-1 flex-row items-start justify-between">
          <Text className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-500">
            {item.tag}
          </Text>
          <Ionicons name="bookmark-outline" size={16} color="#94a3b8" />
        </View>

        <Text className="text-sm font-bold text-slate-800">{item.title}</Text>
        <Text className="mt-1 text-[11px] text-slate-500">
          {item.description}
        </Text>

        <View className="mt-2 flex-row items-center gap-1">
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text className="text-[10px] text-slate-400">
            {item.rating} ({item.learners})
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen(): ReactElement {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-dashboard"],
    queryFn: fetchHomeDashboardMock,
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="mt-3 text-sm font-semibold text-slate-500">
          Dang tai dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-red-500">
          Khong the tai du lieu Home.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]">
      <BlurView intensity={20} tint="extraLight" style={styles.blurFill} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View>
              <Image
                source={{ uri: data.greeting.avatarUrl }}
                className="h-12 w-12 rounded-full border-2 border-white"
              />
              <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-400" />
            </View>

            <View>
              <Text className="text-xs font-semibold text-slate-500">
                {data.greeting.greetingLabel}
              </Text>
              <Text className="text-xl font-bold text-slate-800">
                {data.greeting.name} 👋
              </Text>
            </View>
          </View>

          <View
            style={styles.glassCard}
            className="flex-row items-center gap-2 rounded-full px-3 py-1.5"
          >
            <Ionicons name="flame" size={14} color="#f97316" />
            <Text className="text-sm font-bold text-slate-700">
              {data.greeting.streakDays} Ngày
            </Text>
          </View>
        </View>

        <View
          style={styles.glassCard}
          className="mb-8 overflow-hidden rounded-[32px] p-6"
        >
          <Ionicons name="chatbox-ellipses" size={30} color="#c4b5fd" />
          <Text className="mb-3 mt-2 text-lg font-bold italic leading-7 text-slate-700">
            {data.quote.content}
          </Text>
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
            - {data.quote.author}
          </Text>
        </View>

        <View className="mb-4 flex-row items-end justify-between">
          <Text className="text-lg font-extrabold text-slate-800">
            Đang học dở
          </Text>
          <Text className="text-xs font-bold text-violet-500">Tất cả</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-8"
          contentContainerClassName="pr-2"
        >
          {data.continueLearning.map((item) => (
            <ContinueLearningCard item={item} key={item.id} />
          ))}
        </ScrollView>

        <Text className="mb-4 text-lg font-extrabold text-slate-800">
          Mục tiêu hôm nay
        </Text>
        <View className="mb-8 flex-row gap-4">
          <View
            style={styles.glassCard}
            className="flex-1 items-center rounded-[24px] p-4"
          >
            <View className="mb-2 h-16 w-16 items-center justify-center rounded-full border-[6px] border-slate-100 border-r-violet-500 border-t-violet-500">
              <Text className="text-sm font-bold text-slate-700">
                {data.goals.achievedXp}
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-500">
              XP đạt được
            </Text>
            <Text className="text-[10px] text-slate-400">
              Mục tiêu: {data.goals.targetXp} XP
            </Text>
          </View>

          <View style={styles.glassCard} className="flex-1 rounded-[24px] p-4">
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Daily task
            </Text>
            <View className="mb-2 flex-row items-center gap-2 opacity-55">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-xs text-slate-500 line-through">
                Xem 1 Video
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="ellipse-outline" size={14} color="#8b5cf6" />
              <Text className="text-xs font-bold text-slate-700">
                {data.goals.dailyTaskLabel}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="sparkles" size={16} color="#8b5cf6" />
          <Text className="text-lg font-extrabold text-slate-800">
            Gợi ý riêng cho bạn
          </Text>
        </View>

        {data.recommendations.map((item) => (
          <RecommendationCard item={item} key={item.id} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.66)",
    borderColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    shadowColor: "#1f2687",
    shadowOpacity: 0.05,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 24,
    elevation: 2,
  },
  bgMeshLayerA: {
    position: "absolute",
    top: -90,
    left: -70,
    width: 320,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(221,214,254,0.35)",
  },
  bgMeshLayerB: {
    position: "absolute",
    top: 70,
    right: -80,
    width: 300,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(251,207,232,0.35)",
  },
  bgMeshLayerC: {
    position: "absolute",
    bottom: 60,
    right: 20,
    width: 280,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(196,181,253,0.35)",
  },
});
