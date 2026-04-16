import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { NotificationControllerService } from "../../services/api/NotificationControllerService";
import type { UserNotificationResponse } from "@/types";

type NotificationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Notifications"
>;

const PAGE_SIZE = 12;

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

export default function NotificationsScreen({
  navigation,
}: NotificationsScreenProps): ReactElement {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", page],
    queryFn: () =>
      NotificationControllerService.getNotifications({
        page,
        size: PAGE_SIZE,
      }),
    retry: false,
  });

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => NotificationControllerService.countUnreadNotifications(),
    retry: false,
  });

  const items = (notificationsQuery.data?.data ??
    []) as UserNotificationResponse[];
  const totalPages = Number(notificationsQuery.data?.meta?.totalPages ?? 1);
  const currentUnreadCount = Number(unreadCountQuery.data?.data ?? 0);

  const updateNotificationCache = (
    updater: (items: UserNotificationResponse[]) => UserNotificationResponse[],
  ): void => {
    queryClient.setQueryData(["notifications", page], (current: unknown) => {
      const currentData = current as
        | { data?: UserNotificationResponse[]; meta?: unknown }
        | undefined;

      return {
        ...currentData,
        data: updater(currentData?.data ?? []),
      };
    });
  };

  const toggleReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await NotificationControllerService.toggleRead({ notificationId });
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", page] });
      await queryClient.cancelQueries({
        queryKey: ["notifications", "unread-count"],
      });

      const previousNotifications = queryClient.getQueryData([
        "notifications",
        page,
      ]);
      const previousUnread = queryClient.getQueryData([
        "notifications",
        "unread-count",
      ]);

      updateNotificationCache((list) =>
        list.map((item) =>
          String(item.id) === notificationId
            ? { ...item, isRead: !Boolean(item.isRead) }
            : item,
        ),
      );

      queryClient.setQueryData(
        ["notifications", "unread-count"],
        (current: unknown) => {
          const currentData = current as { data?: number } | undefined;
          const nextUnread = Math.max(
            0,
            Number(currentData?.data ?? 0) +
              (items.find((item) => String(item.id) === notificationId)?.isRead
                ? 1
                : -1),
          );
          return { ...currentData, data: nextUnread };
        },
      );

      return { previousNotifications, previousUnread };
    },
    onError: (error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", page],
          context.previousNotifications,
        );
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          context.previousUnread,
        );
      }
      Alert.alert(
        "Lỗi",
        getApiErrorMessage(error, "Không thể đổi trạng thái thông báo."),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", page] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await NotificationControllerService.deleteNotification({
        notificationId,
      });
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", page] });
      await queryClient.cancelQueries({
        queryKey: ["notifications", "unread-count"],
      });

      const previousNotifications = queryClient.getQueryData([
        "notifications",
        page,
      ]);
      const previousUnread = queryClient.getQueryData([
        "notifications",
        "unread-count",
      ]);

      const removedUnread = items.find(
        (item) => String(item.id) === notificationId,
      )?.isRead
        ? 0
        : 1;

      updateNotificationCache((list) =>
        list.filter((item) => String(item.id) !== notificationId),
      );
      queryClient.setQueryData(
        ["notifications", "unread-count"],
        (current: unknown) => {
          const currentData = current as { data?: number } | undefined;
          return {
            ...currentData,
            data: Math.max(0, Number(currentData?.data ?? 0) - removedUnread),
          };
        },
      );

      return { previousNotifications, previousUnread };
    },
    onError: (error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications", page],
          context.previousNotifications,
        );
      }
      if (context?.previousUnread) {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          context.previousUnread,
        );
      }
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể xóa thông báo."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", page] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const testPushMutation = useMutation({
    mutationFn: async () => {
      await NotificationControllerService.testPushNotification({
        title: "[DEV] Test push notification",
        body: "Push notification integration is working.",
      });
    },
    onSuccess: () => {
      Alert.alert("Thành công", "Đã gửi test push notification.");
    },
    onError: (error) => {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể gửi test push."));
    },
  });

  const onRefresh = async (): Promise<void> => {
    await Promise.all([
      notificationsQuery.refetch(),
      unreadCountQuery.refetch(),
    ]);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const headerSubtitle = useMemo(() => {
    return currentUnreadCount > 0
      ? `${currentUnreadCount} thông báo chưa đọc`
      : "Tất cả đã được đọc";
  }, [currentUnreadCount]);

  if (notificationsQuery.isLoading && page === 1) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-transparent">
        <AppScreenBackground />
        <ActivityIndicator size="large" color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />
      <View className="px-4 pt-3 pb-2">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/80"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isRefetching}
            onRefresh={() => void onRefresh()}
          />
        }
        ListHeaderComponent={
          <View className="rounded-3xl border border-white/70 bg-white/75 p-4 gap-2">
            <Text className="text-lg font-black text-slate-800">
              Hộp thư thông báo
            </Text>
            <Text className="text-xs font-semibold text-slate-500">
              {headerSubtitle}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Pressable
                className={`h-9 flex-1 items-center justify-center rounded-2xl ${canGoPrev ? "bg-slate-900" : "bg-slate-300"}`}
                disabled={!canGoPrev}
                onPress={() => setPage((previous) => Math.max(1, previous - 1))}
              >
                <Text className="text-xs font-bold text-white">
                  Trang trước
                </Text>
              </Pressable>
              <View className="h-9 flex-1 items-center justify-center rounded-2xl bg-violet-50">
                <Text className="text-xs font-bold text-violet-700">
                  {page}/{Math.max(1, totalPages)}
                </Text>
              </View>
              <Pressable
                className={`h-9 flex-1 items-center justify-center rounded-2xl ${canGoNext ? "bg-violet-600" : "bg-slate-300"}`}
                disabled={!canGoNext}
                onPress={() =>
                  setPage((previous) => Math.min(totalPages, previous + 1))
                }
              >
                <Text className="text-xs font-bold text-white">Trang sau</Text>
              </Pressable>
            </View>
            {__DEV__ ? (
              <Pressable
                className="mt-2 h-9 items-center justify-center rounded-2xl bg-amber-500"
                disabled={testPushMutation.isPending}
                onPress={() => {
                  void testPushMutation.mutateAsync();
                }}
              >
                <Text className="text-xs font-bold text-white">
                  {testPushMutation.isPending
                    ? "Đang gửi test push..."
                    : "[DEV] Gửi test push"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-3xl border border-white/70 bg-white/75 p-6 items-center">
            <Ionicons name="notifications-off" size={32} color="#94a3b8" />
            <Text className="mt-3 text-sm font-bold text-slate-800">
              Chưa có thông báo
            </Text>
            <Text className="mt-1 text-xs text-slate-500 text-center">
              Khi có thông báo mới, chúng sẽ xuất hiện tại đây.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isRead = Boolean(item.isRead);

          return (
            <View
              className={`rounded-3xl border p-4 gap-3 ${isRead ? "border-white/70 bg-white/70" : "border-violet-200 bg-violet-50"}`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-black text-slate-800">
                    {item.title ?? "Thông báo"}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-600">
                    {item.message ?? ""}
                  </Text>
                </View>
                {!isRead ? (
                  <View className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                ) : null}
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  className="flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2"
                  disabled={toggleReadMutation.isPending}
                  onPress={() => {
                    void toggleReadMutation.mutateAsync(String(item.id ?? ""));
                  }}
                >
                  <Text className="text-xs font-bold text-white">
                    {isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  </Text>
                </Pressable>
                <Pressable
                  className="items-center justify-center rounded-2xl bg-red-50 px-4 py-2"
                  disabled={deleteMutation.isPending}
                  onPress={() => {
                    Alert.alert(
                      "Xóa thông báo",
                      "Bạn có chắc muốn xóa thông báo này?",
                      [
                        { text: "Hủy", style: "cancel" },
                        {
                          text: "Xóa",
                          style: "destructive",
                          onPress: () => {
                            void deleteMutation.mutateAsync(
                              String(item.id ?? ""),
                            );
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Text className="text-xs font-bold text-red-600">Xóa</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
