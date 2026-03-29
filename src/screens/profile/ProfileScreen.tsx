import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  fetchUserProfileDataMock,
  updateUserProfileMock,
} from "../../services/api/profileApi";
import type { UpdateProfilePayload, UserProfile } from "../../types/profile";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../../navigation/AppNavigator";
import { useAuthStore } from "../../store/useAuthStore";

type ProfileScreenProps = BottomTabNavigationProp<MainTabParamList, "Profile">;

// Menu Section Component
function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <View className="mb-6">
      <Text className="mb-2 ml-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </Text>
      <View className="overflow-hidden rounded-3xl" style={styles.glassPanel}>
        {children}
      </View>
    </View>
  );
}

// Menu List Item Component
function MenuItem({
  icon,
  title,
  color,
  badge,
  onPress,
}: {
  icon: string;
  title: string;
  color: string;
  badge?: number;
  onPress?: () => void;
}): ReactElement {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-100",
    blue: "bg-blue-100",
    pink: "bg-pink-100",
    emerald: "bg-emerald-100",
    violet: "bg-violet-100",
    indigo: "bg-indigo-100",
    red: "bg-red-50",
  };

  const iconColorMap: Record<string, string> = {
    orange: "#f97316",
    blue: "#2563eb",
    pink: "#ec4899",
    emerald: "#059669",
    violet: "#9333ea",
    indigo: "#4f46e5",
    red: "#ef4444",
  };

  return (
    <Pressable
      onPress={onPress}
      className="border-b border-slate-100/80 flex-row items-center justify-between px-4 py-4 last:border-b-0"
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded-xl ${colorMap[color as keyof typeof colorMap]}`}
        >
          <Ionicons
            name={icon as any}
            size={16}
            color={iconColorMap[color as keyof typeof iconColorMap]}
          />
        </View>
        <Text className="text-sm font-bold text-slate-700">{title}</Text>
      </View>

      <View className="flex-row items-center gap-2">
        {badge !== undefined && (
          <View className="h-5 w-5 items-center justify-center rounded-full bg-red-500">
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>
    </Pressable>
  );
}

// Toggle Settings Item
function SettingToggleItem({
  icon,
  title,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}): ReactElement {
  const toggleColor = value ? "#8b5cf6" : "#cbd5e1";

  return (
    <View className="border-b border-slate-100/80 flex-row items-center justify-between px-4 py-4 last:border-b-0">
      <View className="flex-row items-center gap-3">
        <View
          className={
            icon === "bell"
              ? "h-8 w-8 items-center justify-center rounded-xl bg-slate-100"
              : "h-8 w-8 items-center justify-center rounded-xl bg-slate-900"
          }
        >
          <Ionicons
            name={icon as any}
            size={16}
            color={icon === "bell" ? "#64748b" : "white"}
          />
        </View>
        <Text className="text-sm font-bold text-slate-700">{title}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="white"
        trackColor={{ false: "#cbd5e1", true: "#a78bfa" }}
      />
    </View>
  );
}

// Edit Profile Bottom Sheet Modal
function EditProfileModal({
  visible,
  profile,
  onClose,
  onSave,
  isSaving,
}: {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (data: UpdateProfilePayload) => void;
  isSaving: boolean;
}): ReactElement {
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    name: "",
    email: "",
    phone: "",
  });
  const [shouldRender, setShouldRender] = useState(visible);
  const sheetTranslateY = useRef(new Animated.Value(420)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
    }
  }, [profile, visible]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 420,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [visible, shouldRender, backdropOpacity, sheetTranslateY]);

  if (!shouldRender) return <></>;

  return (
    <Animated.View
      style={[
        styles.modalOverlay,
        {
          opacity: backdropOpacity,
        },
      ]}
    >
      <Pressable onPress={onClose} style={styles.modalBackdropPressable} />

      <Animated.View
        className="w-full rounded-t-3xl bg-white"
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        {/* Handle */}
        <View className="mb-6 mt-6 h-1.5 w-12 self-center rounded-full bg-slate-200" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        >
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-800">
              Chỉnh sửa hồ sơ
            </Text>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <Ionicons name="close" size={16} color="#64748b" />
            </Pressable>
          </View>

          {/* Avatar Preview */}
          <View className="mb-6 items-center">
            {profile && (
              <View className="relative">
                <Image
                  source={{ uri: profile.avatar }}
                  className="h-24 w-24 rounded-full border-4 border-slate-50"
                />
                <Pressable className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600">
                  <Ionicons name="camera" size={16} color="white" />
                </Pressable>
              </View>
            )}
            <Text className="mt-2 text-xs font-semibold text-violet-600">
              Thay đổi ảnh
            </Text>
          </View>

          {/* Form Fields */}
          <View className="mb-6 space-y-4">
            {/* Name Input */}
            <View className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Họ và tên
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                placeholder="Nhập tên của bạn..."
                className="mt-1 border-none bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </View>

            {/* Email Input */}
            <View className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Email
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, email: text }))
                }
                placeholder="Nhập email của bạn..."
                className="mt-1 border-none bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </View>

            {/* Phone Input */}
            <View className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Số điện thoại
              </Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, phone: text }))
                }
                placeholder="Ví dụ: 0987654321"
                className="mt-1 border-none bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </View>
          </View>
        </ScrollView>

        {/* Fixed Save Button at Bottom */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-center gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <Pressable
            onPress={() => onSave(formData)}
            disabled={isSaving}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 shadow-lg shadow-violet-600/30"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="white" />
                <Text className="font-bold text-white">Lưu thay đổi</Text>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// Main Component
export default function ProfileScreen(): ReactElement {
  const navigation = useNavigation<ProfileScreenProps>();

  // State Management
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Hide tab bar when edit modal is visible
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: editModalVisible
        ? { display: "none" }
        : {
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            left: 0,
            right: 0,
            marginHorizontal: 20,
            bottom: 18,
            height: 72,
            borderRadius: 999,
            backgroundColor: "transparent",
            elevation: 0,
            overflow: "hidden",
          },
    });

    return () => {
      navigation.setOptions({
        tabBarStyle: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          left: 0,
          right: 0,
          marginHorizontal: 20,
          bottom: 18,
          height: 72,
          borderRadius: 999,
          backgroundColor: "transparent",
          elevation: 0,
          overflow: "hidden",
        },
      });
    };
  }, [editModalVisible, navigation]);

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetchUserProfileDataMock(),
  });

  // Mutation for updating profile
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    setIsUpdating(true);
    try {
      await updateUserProfileMock(payload);
      // In real app: Update Zustand store here
      setEditModalVisible(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear auth token
      await AsyncStorage.removeItem("authToken");
      useAuthStore.getState().logout();

      // Navigate to login
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate("Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleMenuPress = (route?: string) => {
    if (route) {
      navigation.navigate(route as any);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#9333ea" />
      </SafeAreaView>
    );
  }

  const profile = profileData?.profile;
  const stats = profileData?.stats;
  const menuItems = profileData?.menuItems || [];

  // Group menu items by category
  const learningItems = menuItems.filter(
    (item) => item.category === "learning",
  );
  const transactionItems = menuItems.filter(
    (item) => item.category === "transactions",
  );
  const settingItems = menuItems.filter((item) => item.category === "settings");
  const supportItems = menuItems.filter((item) => item.category === "support");

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between px-6 py-2">
          <Text className="text-lg font-bold text-slate-800">Tài khoản</Text>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Ionicons name="settings" size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Profile Info Card */}
        <View
          className="mx-6 items-center rounded-3xl p-5 mb-6"
          style={styles.glassPanel}
        >
          {/* Edit Button */}
          <Pressable
            onPress={() => setEditModalVisible(true)}
            className="absolute right-5 top-5 h-12 w-12 items-center justify-center rounded-full bg-violet-50"
          >
            <Ionicons name="pencil" size={16} color="#9333ea" />
          </Pressable>

          {/* Avatar */}
          <View className="mb-3 relative">
            {profile && (
              <View className="relative h-20 w-20">
                <Image
                  source={{ uri: profile.avatar }}
                  className="h-20 w-20 rounded-full border-2 border-violet-500"
                />
                <Pressable className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 shadow-md">
                  <Ionicons name="camera" size={14} color="white" />
                </Pressable>
              </View>
            )}
          </View>

          {/* Profile Info */}
          {profile && (
            <>
              <Text className="text-xl font-black tracking-tight text-slate-800">
                {profile.name}
              </Text>
              <Text className="mb-3 text-sm font-medium text-slate-500">
                {profile.email}
              </Text>
            </>
          )}

          {/* Member Badge */}
          <View className="mb-4 flex-row items-center gap-1.5 rounded-full border border-yellow-200 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1">
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text className="text-xs font-bold tracking-wide text-amber-700">
              PRO MEMBER
            </Text>
          </View>

          {/* Edit Profile Button */}
          <Pressable
            onPress={() => setEditModalVisible(true)}
            className="mb-4 w-full flex-row items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5"
          >
            <Text className="text-sm font-bold text-slate-700">
              Chỉnh sửa hồ sơ
            </Text>
          </Pressable>

          {/* Stats Grid */}
          {stats && (
            <View className="w-full border-t border-slate-200/60 pt-4">
              <View className="flex-row items-center justify-around">
                <View className="items-center">
                  <Text className="text-xl font-black text-violet-600">
                    {stats.streakDays}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Ngày học
                  </Text>
                </View>
                <View className="h-8 w-px bg-slate-200/60" />
                <View className="items-center">
                  <Text className="text-xl font-black text-fuchsia-600">
                    {stats.certificatesCount}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Chứng chỉ
                  </Text>
                </View>
                <View className="h-8 w-px bg-slate-200/60" />
                <View className="items-center">
                  <Text className="text-xl font-black text-blue-600">
                    {(stats.totalXP / 1000).toFixed(1)}k
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Điểm XP
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Learning Section */}
        {learningItems.length > 0 && (
          <MenuSection title="Học tập & Thành tích">
            {learningItems.map((item) => (
              <MenuItem
                key={item.id}
                icon={item.icon}
                title={item.title}
                color={item.color}
                badge={item.badge}
                onPress={() => handleMenuPress(item.route)}
              />
            ))}
          </MenuSection>
        )}

        {/* Transactions Section */}
        {transactionItems.length > 0 && (
          <MenuSection title="Giao dịch">
            {transactionItems.map((item) => (
              <MenuItem
                key={item.id}
                icon={item.icon}
                title={item.title}
                color={item.color}
                onPress={() => handleMenuPress(item.route)}
              />
            ))}
          </MenuSection>
        )}

        {/* Settings Section */}
        {settingItems.length > 0 && (
          <MenuSection title="Cài đặt ứng dụng">
            {settingItems
              .filter((item) => item.id === "push-notifications")
              .map((item) => (
                <SettingToggleItem
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              ))}
            {settingItems
              .filter((item) => item.id === "dark-mode")
              .map((item) => (
                <SettingToggleItem
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                />
              ))}
            {settingItems
              .filter((item) => item.id === "language")
              .map((item) => (
                <MenuItem
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  color={item.color}
                />
              ))}
          </MenuSection>
        )}

        {/* Support & Actions */}
        {supportItems.length > 0 && (
          <MenuSection title="">
            {supportItems.map((item) => (
              <MenuItem
                key={item.id}
                icon={item.icon}
                title={item.title}
                color={item.color}
                onPress={() => handleMenuPress(item.route)}
              />
            ))}
            <Pressable
              onPress={handleLogout}
              className="border-b border-slate-100/80 flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                  <Ionicons name="log-out" size={16} color="#ef4444" />
                </View>
                <Text className="text-sm font-bold text-red-500">
                  Đăng xuất
                </Text>
              </View>
            </Pressable>
          </MenuSection>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        profile={profile || null}
        onClose={() => setEditModalVisible(false)}
        onSave={handleUpdateProfile}
        isSaving={isUpdating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundContainer: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },
  blob1: {
    position: "absolute",
    top: "-10%",
    right: "-10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(244, 194, 194, 0.4)", // pink-200/40
    opacity: 0.6,
  },
  blob2: {
    position: "absolute",
    top: "30%",
    left: "-20%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(221, 214, 254, 0.4)", // violet-200/40
    opacity: 0.6,
  },
  blob3: {
    position: "absolute",
    bottom: "-10%",
    right: "10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(191, 219, 254, 0.4)", // blue-200/40
    opacity: 0.6,
  },
  glassPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 32,
    overflow: "hidden",
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
});
