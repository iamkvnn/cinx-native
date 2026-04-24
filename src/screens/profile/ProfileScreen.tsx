import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  MenuItem,
  MenuSection,
} from "../../components/domain/profile/ProfileMenuItems";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../../navigation/AppNavigator";
import {
  fetchCurrentUser,
  sendUpdateOtp,
  updateProfile,
  updateSensitiveInfo,
} from "../../services/api/authApi";
import { useAuthStore } from "../../store/useAuthStore";

type ProfileScreenProps = BottomTabNavigationProp<MainTabParamList, "Profile">;
type ModalType = "edit-profile" | "edit-avatar" | "sensitive" | null;
type SensitiveKind = "password";

const FALLBACK_AVATAR = "https://i.pravatar.cc/200?img=12";

const notify = (message: string): void => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert("Thông báo", message);
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const readString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export default function ProfileScreen(): ReactElement {
  const navigation = useNavigation<ProfileScreenProps>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [refreshing, setRefreshing] = useState(false);

  const userProfileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: fetchCurrentUser,
    enabled: Boolean(user),
  });

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [shouldRenderModal, setShouldRenderModal] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(460)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [fullNameInput, setFullNameInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [avatarInput, setAvatarInput] = useState("");
  const [pickedAvatarUri, setPickedAvatarUri] = useState("");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const [sensitiveKind, setSensitiveKind] = useState<SensitiveKind>("email");
  const [sensitiveValue, setSensitiveValue] = useState("");
  const [confirmSensitiveValue, setConfirmSensitiveValue] = useState("");
  const [currentPasswordValue, setCurrentPasswordValue] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmNewPasswordValue, setConfirmNewPasswordValue] = useState("");
  const [sensitiveStep, setSensitiveStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingSensitiveOtp, setIsSendingSensitiveOtp] = useState(false);
  const [isSavingSensitiveInfo, setIsSavingSensitiveInfo] = useState(false);

  const fullNameInputRef = useRef<TextInput | null>(null);
  const sensitiveValueInputRef = useRef<TextInput | null>(null);
  const currentPasswordInputRef = useRef<TextInput | null>(null);
  const otpInputRef = useRef<TextInput | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeUser = userProfileQuery.data ?? user;
  const userRecord = (activeUser ?? {}) as Record<string, unknown>;
  const profileRecord =
    (userRecord.profile as Record<string, unknown> | undefined) ?? {};

  useEffect(() => {
    if (userProfileQuery.data) {
      setUser(userProfileQuery.data);
    }
  }, [setUser, userProfileQuery.data]);

  const profileName = useMemo(() => {
    return (
      readString(userRecord.fullName) ||
      readString(profileRecord.fullName) ||
      "Học viên"
    );
  }, [profileRecord.fullName, userRecord.fullName]);

  const profileEmail = useMemo(() => {
    return (
      readString(userRecord.email) ||
      readString(profileRecord.email) ||
      "Chưa cập nhật"
    );
  }, [profileRecord.email, userRecord.email]);

  const profileAvatar = useMemo(() => {
    return (
      readString(userRecord.avatar) ||
      readString(profileRecord.avatar) ||
      FALLBACK_AVATAR
    );
  }, [profileRecord.avatar, userRecord.avatar]);

  const navigateRoot = (screen: keyof RootStackParamList): void => {
    const rootNavigation = navigation.getParent() as
      | NativeStackNavigationProp<RootStackParamList>
      | undefined;

    rootNavigation?.navigate(screen as never);
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await userProfileQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const visible = activeModal !== null;

    if (visible) {
      setShouldRenderModal(true);
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
    } else if (shouldRenderModal) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 460,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShouldRenderModal(false);
        }
      });
    }
  }, [activeModal, backdropOpacity, sheetTranslateY, shouldRenderModal]);

  useEffect(() => {
    const modalVisible = activeModal !== null;

    navigation.setOptions({
      tabBarStyle: modalVisible
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
  }, [activeModal, navigation]);

  useEffect(() => {
    if (!shouldRenderModal || !activeModal) {
      return;
    }

    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }

    const delay =
      activeModal === "edit-profile"
        ? 360
        : activeModal === "edit-avatar"
          ? 360
          : sensitiveKind === "password"
            ? 220
            : sensitiveStep === 2
              ? 220
              : 360;

    focusTimeoutRef.current = setTimeout(() => {
      if (activeModal === "edit-profile") {
        fullNameInputRef.current?.focus();
        return;
      }

      if (sensitiveKind === "password") {
        currentPasswordInputRef.current?.focus();
        return;
      }

      if (sensitiveStep === 2) {
        otpInputRef.current?.focus();
        return;
      }

      sensitiveValueInputRef.current?.focus();
    }, delay);

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [activeModal, sensitiveKind, sensitiveStep, shouldRenderModal]);

  const closeModal = (): void => {
    if (
      isSavingProfile ||
      isSavingAvatar ||
      isSendingSensitiveOtp ||
      isSavingSensitiveInfo
    ) {
      return;
    }

    setActiveModal(null);
  };

  const openEditProfileModal = (): void => {
    setFullNameInput(profileName);
    setActiveModal("edit-profile");
  };

  const openEditAvatarModal = (): void => {
    setAvatarInput(profileAvatar === FALLBACK_AVATAR ? "" : profileAvatar);
    setPickedAvatarUri("");
    setActiveModal("edit-avatar");
  };

  const openSensitiveModal = (kind: SensitiveKind): void => {
    setSensitiveKind(kind);
    setSensitiveStep(1);
    setSensitiveValue("");
    setConfirmSensitiveValue("");
    setCurrentPasswordValue("");
    setNewPasswordValue("");
    setConfirmNewPasswordValue("");
    setOtpCode("");
    setActiveModal("sensitive");
  };

  const updateUserInStore = (nextUser: Record<string, unknown>): void => {
    const previous = useAuthStore.getState().user as Record<
      string,
      unknown
    > | null;

    const mergedUser = {
      ...(previous ?? {}),
      ...nextUser,
      profile: {
        ...((previous?.profile as Record<string, unknown> | undefined) ?? {}),
        fullName:
          readString(nextUser.fullName) ||
          readString(
            (previous?.profile as Record<string, unknown> | undefined)
              ?.fullName,
          ),
        email:
          readString(nextUser.email) ||
          readString(
            (previous?.profile as Record<string, unknown> | undefined)?.email,
          ),
        phone:
          readString(nextUser.phone) ||
          readString(
            (previous?.profile as Record<string, unknown> | undefined)?.phone,
          ),
        avatar:
          readString(nextUser.avatar) ||
          readString(
            (previous?.profile as Record<string, unknown> | undefined)?.avatar,
          ),
      },
    };

    // Keep React Query cache in sync because UI prefers userProfileQuery.data.
    queryClient.setQueryData(["user-profile"], mergedUser);
    useAuthStore.getState().setUser(mergedUser);
  };

  const handleSaveProfile = async (): Promise<void> => {
    if (isSavingProfile) {
      return;
    }

    const nextFullName = fullNameInput.trim();
    const payload = {
      fullName: nextFullName,
    };

    if (!payload.fullName) {
      notify("Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedUser = await updateProfile(payload);

      // Optimistic: some backends return stale data; force UI to reflect input immediately.
      updateUserInStore({
        ...(updatedUser as Record<string, unknown>),
        fullName: nextFullName,
        name: nextFullName,
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      notify("Cập nhật hồ sơ thành công.");
      setActiveModal(null);
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAvatar = async (): Promise<void> => {
    if (isSavingAvatar) {
      return;
    }

    const normalizedCurrentAvatar =
      profileAvatar === FALLBACK_AVATAR ? "" : profileAvatar.trim();
    const manualAvatarInput = avatarInput.trim();
    const selectedAvatarUri = pickedAvatarUri.trim();
    const shouldSendManualAvatar =
      manualAvatarInput.length > 0 &&
      manualAvatarInput !== normalizedCurrentAvatar;

    const avatarUri =
      selectedAvatarUri || (shouldSendManualAvatar ? manualAvatarInput : "");

    if (!avatarUri) {
      notify("Vui lòng chọn ảnh hoặc nhập URL avatar.");
      return;
    }

    const payload = {
      avatarUri,
    };

    try {
      setIsSavingAvatar(true);
      const updatedUser = await updateProfile(payload);

      // Optimistic: show chosen URL/local image instantly, then refetch to get canonical avatarUrl.
      updateUserInStore({
        ...(updatedUser as Record<string, unknown>),
        avatar: avatarUri,
        avatarUrl: avatarUri,
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      notify("Cập nhật ảnh đại diện thành công.");
      setActiveModal(null);
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handlePickAvatar = async (): Promise<void> => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        notify("Cần quyền truy cập thư viện ảnh để chọn avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled) {
        return;
      }

      setPickedAvatarUri(result.assets[0]?.uri ?? "");
    } catch (error) {
      Alert.alert(
        "Không thể chọn ảnh",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    }
  };

  const handleSendSensitiveOtp = async (): Promise<void> => {
    if (isSendingSensitiveOtp) {
      return;
    }

    const value = sensitiveValue.trim();
    const currentEmail = activeUser?.email;

    if (sensitiveKind === "email" && !isValidEmail(value)) {
      notify("Email mới không hợp lệ.");
      return;
    }

    if (!currentEmail) {
      notify("Không tìm thấy email hiện tại của bạn.");
      return;
    }

    try {
      setIsSendingSensitiveOtp(true);
      // For changing email, we send OTP to the CURRENT email to verify identity
      const payload = sensitiveKind === "email" ? { email: currentEmail } : {};

      await sendUpdateOtp(payload);
      setSensitiveStep(2);
      notify(`OTP đã được gửi tới ${currentEmail}`);
    } catch (error) {
      Alert.alert(
        "Không thể gửi OTP",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setIsSendingSensitiveOtp(false);
    }
  };

  const handleSaveSensitiveInfo = async (): Promise<void> => {
    if (isSavingSensitiveInfo) {
      return;
    }

    const value = sensitiveValue.trim();
    const currentPassword = currentPasswordValue.trim();
    const nextPassword = newPasswordValue.trim();
    const confirmNewPassword = confirmNewPasswordValue.trim();
    const otp = otpCode.trim();

    if (sensitiveKind === "password") {
      if (!currentPassword || !nextPassword || !confirmNewPassword) {
        notify("Vui lòng nhập mật khẩu cũ và xác nhận mật khẩu mới.");
        return;
      }

      if (currentPassword === nextPassword) {
        notify("Mật khẩu mới phải khác mật khẩu cũ.");
        return;
      }

      if (nextPassword !== confirmNewPassword) {
        notify("Xác nhận mật khẩu mới không khớp.");
        return;
      }
    } else if (!otp || otp.length !== 6) {
      notify("Vui lòng nhập OTP gồm 6 chữ số.");
      return;
    }

    try {
      setIsSavingSensitiveInfo(true);
      const updatedUser = await updateSensitiveInfo({
        otp,
        oldPassword: sensitiveKind === "password" ? currentPassword : undefined,
        newEmail: sensitiveKind === "email" ? value : undefined,
        newPassword: sensitiveKind === "password" ? nextPassword : undefined,
      });

      if (sensitiveKind === "email") {
        const nextUser = {
          ...(updatedUser as Record<string, unknown>),
          email: value,
        };
        updateUserInStore(nextUser);
      }

      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      await userProfileQuery.refetch();

      Alert.alert("Cập nhật thành công!", "Thông tin đã được lưu.");
      setActiveModal(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = (
          error.response?.data as { message?: string } | undefined
        )?.message;

        if ((status === 400 || status === 401) && message) {
          Alert.alert(
            sensitiveKind === "password"
              ? "Đổi mật khẩu thất bại"
              : "Xác thực OTP thất bại",
            message,
          );
          return;
        }
      }

      Alert.alert(
        sensitiveKind === "password"
          ? "Đổi mật khẩu thất bại"
          : "Xác thực OTP thất bại",
        getApiErrorMessage(error, "Vui lòng thử lại sau."),
      );
    } finally {
      setIsSavingSensitiveInfo(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await useAuthStore.getState().logout();
              } catch (error) {
                notify(getApiErrorMessage(error, "Đăng xuất thất bại."));
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor="#8b5cf6"
          />
        }
      >
        <View className="mb-6 flex-row items-center justify-between px-6 py-2">
          <Text className="text-lg font-bold text-slate-800">Tài khoản</Text>
        </View>

        <View
          className="mx-6 mb-6 items-center rounded-3xl p-5"
          style={styles.glassPanel}
        >
          <BlurView
            intensity={28}
            tint="light"
            style={StyleSheet.absoluteFillObject}
          />

          <View className="relative mb-3 h-20 w-20">
            <Image
              source={{ uri: profileAvatar }}
              className="h-20 w-20 rounded-full "
            />
            <Pressable
              onPress={openEditAvatarModal}
              className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-violet-600"
            >
              <Ionicons name="pencil" size={14} color="#ffffff" />
            </Pressable>
          </View>

          <Text className="text-xl font-black tracking-tight text-slate-800">
            {profileName}
          </Text>
          <Text className="mt-1 text-sm font-medium text-slate-500">
            {profileEmail}
          </Text>
        </View>

        {user?.role !== "INSTRUCTOR" && (
          <MenuSection title="Học tập & Thành tích">
            <MenuItem
              icon="star"
              title="Chứng chỉ của tôi"
              color="orange"
              onPress={() => navigateRoot("MyCertificates")}
              showLeadingIcon={false}
            />
          </MenuSection>
        )}

        <MenuSection title="Giao dịch">
          <MenuItem
            icon="notifications"
            title="Hộp thư thông báo"
            color="red"
            showLeadingIcon={false}
            onPress={() => navigateRoot("Notifications")}
          />
          {user?.role !== "INSTRUCTOR" && (
            <>
              <MenuItem
                icon="receipt"
                title="Lịch sử đơn hàng"
                color="violet"
                showLeadingIcon={false}
                onPress={() => navigateRoot("OrderHistory")}
              />
              <MenuItem
                icon="ticket"
                title="Mã giảm giá"
                color="pink"
                showLeadingIcon={false}
                onPress={() => navigateRoot("Vouchers")}
              />
            </>
          )}
        </MenuSection>

        <MenuSection title="Cài đặt ứng dụng">
          <MenuItem
            icon="person"
            title="Đổi tên"
            color="indigo"
            showLeadingIcon={false}
            onPress={openEditProfileModal}
          />
          <MenuItem
            icon="lock-closed"
            title="Đổi mật khẩu"
            color="orange"
            showLeadingIcon={false}
            onPress={() => openSensitiveModal("password")}
          />
        </MenuSection>

        <MenuSection title="Khác">
          <Pressable
            onPress={() => {
              void handleLogout();
            }}
            className="border-b border-slate-100/80 flex-row items-center justify-between px-4 py-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                <Ionicons name="log-out" size={16} color="#ef4444" />
              </View>
              <Text className="text-sm font-bold text-red-500">Đăng xuất</Text>
            </View>
          </Pressable>
        </MenuSection>
      </ScrollView>

      <Modal
        transparent
        visible={shouldRenderModal}
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View
          style={[styles.modalOverlay, { opacity: backdropOpacity }]}
        >
          <Pressable
            onPress={closeModal}
            style={styles.modalBackdropPressable}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 18 : 0}
            style={styles.modalKeyboardAvoider}
          >
            <Animated.View
              className="w-full overflow-hidden rounded-t-3xl"
              style={[
                styles.bottomSheet,
                { transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <BlurView
                intensity={35}
                tint="light"
                style={StyleSheet.absoluteFillObject}
              />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContentContainer}
              >
                <View className="mb-5 flex-row items-center justify-between">
                  <Text className="text-lg font-black text-slate-800">
                    {activeModal === "edit-profile"
                      ? "Đổi tên"
                      : activeModal === "edit-avatar"
                        ? "Đổi ảnh đại diện"
                        : sensitiveKind === "password"
                          ? "Đổi mật khẩu"
                          : "Đổi email"}
                  </Text>
                  <Pressable
                    onPress={closeModal}
                    className="h-8 w-8 items-center justify-center rounded-full bg-slate-100/90"
                  >
                    <Ionicons name="close" size={16} color="#64748b" />
                  </Pressable>
                </View>

                {activeModal === "edit-profile" ? (
                  <>
                    <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3">
                      <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Họ và tên
                      </Text>
                      <TextInput
                        ref={fullNameInputRef}
                        value={fullNameInput}
                        onChangeText={setFullNameInput}
                        placeholder="Nhập họ và tên"
                        className="mt-1 text-sm font-semibold text-slate-800"
                      />
                    </View>

                    <Pressable
                      onPress={() => {
                        void handleSaveProfile();
                      }}
                      disabled={isSavingProfile}
                      className="h-12 items-center justify-center rounded-2xl bg-violet-600"
                    >
                      {isSavingProfile ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text className="text-sm font-bold text-white">
                          Lưu thay đổi
                        </Text>
                      )}
                    </Pressable>
                  </>
                ) : null}

                {activeModal === "edit-avatar" ? (
                  <>
                    <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3 gap-3">
                      <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Ảnh đại diện
                      </Text>

                      <View className="flex-row items-center gap-3">
                        <Image
                          source={{
                            uri:
                              pickedAvatarUri ||
                              avatarInput ||
                              profileAvatar ||
                              FALLBACK_AVATAR,
                          }}
                          className="h-14 w-14 rounded-full"
                        />
                        <Pressable
                          onPress={() => {
                            void handlePickAvatar();
                          }}
                          className="flex-1 h-11 items-center justify-center rounded-2xl bg-slate-900"
                        >
                          <Text className="text-sm font-bold text-white">
                            Chọn ảnh
                          </Text>
                        </Pressable>
                      </View>

                      {pickedAvatarUri ? (
                        <Pressable
                          onPress={() => setPickedAvatarUri("")}
                          className="self-start rounded-xl bg-red-50 px-3 py-2"
                        >
                          <Text className="text-xs font-bold text-red-600">
                            Bỏ ảnh đã chọn
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => {
                        void handleSaveAvatar();
                      }}
                      disabled={isSavingAvatar}
                      className="h-12 items-center justify-center rounded-2xl bg-violet-600"
                    >
                      {isSavingAvatar ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text className="text-sm font-bold text-white">
                          Lưu ảnh
                        </Text>
                      )}
                    </Pressable>
                  </>
                ) : null}

                {activeModal === "sensitive" ? (
                  <>
                    {sensitiveKind === "password" ? (
                      <>
                        <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3">
                          <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Mật khẩu cũ
                          </Text>
                          <TextInput
                            ref={currentPasswordInputRef}
                            value={currentPasswordValue}
                            onChangeText={setCurrentPasswordValue}
                            placeholder="Nhập mật khẩu cũ"
                            secureTextEntry
                            autoCapitalize="none"
                            className="mt-1 text-sm font-semibold text-slate-800"
                          />
                        </View>

                        <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3">
                          <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Mật khẩu mới
                          </Text>
                          <TextInput
                            value={newPasswordValue}
                            onChangeText={setNewPasswordValue}
                            placeholder="Nhập mật khẩu mới"
                            secureTextEntry
                            autoCapitalize="none"
                            className="mt-1 text-sm font-semibold text-slate-800"
                          />
                        </View>

                        <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3">
                          <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Xác nhận mật khẩu mới
                          </Text>
                          <TextInput
                            value={confirmNewPasswordValue}
                            onChangeText={setConfirmNewPasswordValue}
                            placeholder="Nhập lại mật khẩu mới"
                            secureTextEntry
                            autoCapitalize="none"
                            className="mt-1 text-sm font-semibold text-slate-800"
                          />
                        </View>

                        <Pressable
                          onPress={() => {
                            void handleSaveSensitiveInfo();
                          }}
                          disabled={isSavingSensitiveInfo}
                          className="h-12 items-center justify-center rounded-2xl bg-violet-600"
                        >
                          {isSavingSensitiveInfo ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text className="text-sm font-bold text-white">
                              Lưu mật khẩu mới
                            </Text>
                          )}
                        </Pressable>
                      </>
                    ) : sensitiveStep === 1 ? (
                      <>
                        <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3">
                          <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {sensitiveKind === "email"
                              ? "Email mới"
                                : "Mật khẩu mới"}
                          </Text>
                          <TextInput
                            ref={sensitiveValueInputRef}
                            value={sensitiveValue}
                            onChangeText={setSensitiveValue}
                            placeholder={
                              sensitiveKind === "email"
                                ? "abc@email.com"
                                : "Nhập mật khẩu mới"
                            }
                            keyboardType={
                              sensitiveKind === "email"
                                ? "email-address"
                                : "default"
                            }
                            secureTextEntry={false}
                            autoCapitalize="none"
                            className="mt-1 text-sm font-semibold text-slate-800"
                          />
                        </View>

                        {sensitiveKind === "email" && (
                          <View className="mb-4 px-2">
                            <Text className="text-[11px] font-medium leading-4 text-slate-500">
                              * Hệ thống sẽ gửi mã xác thực (OTP) tới email hiện tại:{" "}
                              <Text className="font-bold text-slate-700">
                                {activeUser?.email}
                              </Text>
                            </Text>
                          </View>
                        )}

                        <Pressable
                          onPress={() => {
                            void handleSendSensitiveOtp();
                          }}
                          disabled={isSendingSensitiveOtp}
                          className="h-12 items-center justify-center rounded-2xl bg-violet-600"
                        >
                          {isSendingSensitiveOtp ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text className="text-sm font-bold text-white">
                              Lấy mã OTP
                            </Text>
                          )}
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Text className="mb-3 text-sm font-medium text-slate-600">
                          OTP đã được gửi tới email hiện tại của bạn.
                        </Text>

                        <View className="mb-3 rounded-2xl border border-white/80 bg-white/65 px-4 py-3">
                          <Text className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Mã OTP
                          </Text>
                          <TextInput
                            ref={otpInputRef}
                            value={otpCode}
                            onChangeText={setOtpCode}
                            placeholder="Nhập mã OTP"
                            keyboardType="number-pad"
                            maxLength={6}
                            className="mt-1 text-sm font-semibold text-slate-800"
                          />
                        </View>

                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => {
                              setSensitiveStep(1);
                              setOtpCode("");
                            }}
                            disabled={isSavingSensitiveInfo}
                            className="h-12 flex-1 items-center justify-center rounded-2xl bg-slate-200"
                          >
                            <Text className="text-sm font-bold text-slate-700">
                              Quay lại
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              void handleSaveSensitiveInfo();
                            }}
                            disabled={isSavingSensitiveInfo}
                            className="h-12 flex-1 items-center justify-center rounded-2xl bg-violet-600"
                          >
                            {isSavingSensitiveInfo ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Text className="text-sm font-bold text-white">
                                Xác nhận & Lưu
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      </>
                    )}
                  </>
                ) : null}
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(244, 194, 194, 1)",
    opacity: 1,
  },
  blob2: {
    position: "absolute",
    top: "30%",
    left: "-20%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(221, 214, 254, 1)",
    opacity: 1,
  },
  blob3: {
    position: "absolute",
    bottom: "-10%",
    right: "10%",
    width: "70%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "rgba(191, 219, 254, 1)",
    opacity: 1,
  },
  glassPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 32,
    overflow: "hidden",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
  },
  modalBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalKeyboardAvoider: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "rgba(255,255,255,0.83)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    maxHeight: "88%",
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
});
