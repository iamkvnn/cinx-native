import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { BlurView } from "expo-blur";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/AppNavigator";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import { AuthControllerService } from "../../services/api/AuthControllerService";
import {
  register as registerUser,
  resetPassword as resetUserPassword,
  sendForgotPasswordOtp,
} from "../../services/api/authApi";
import { useAuthStore } from "../../store/useAuthStore";
import CustomButton from "../../components/ui/buttons/CustomButton";
import CustomInput from "../../components/ui/inputs/CustomInput";
import Logo from "../../components/ui/Logo";
import { uploadAuthCvToS3 } from "../../utils/uploadToS3";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;
type AuthMode = "login" | "register" | "forgot-password";
type RegisterRole = "USER" | "INSTRUCTOR";
type ResetStep = 1 | 2;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.response?.data as { error?: string } | undefined)?.error;

    return message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default function LoginScreen({
  navigation,
  route,
}: LoginScreenProps): ReactElement {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState("imkai512@gmail.com");
  const [password, setPassword] = useState("nguyen512");
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerRole, setRegisterRole] = useState<RegisterRole>("USER");
  const [registerCvFileName, setRegisterCvFileName] = useState("");
  const [registerCvFileKey, setRegisterCvFileKey] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isRegisterCvUploading, setIsRegisterCvUploading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<ResetStep>(1);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] =
    useState(false);
  const [switcherWidth, setSwitcherWidth] = useState(0);

  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(indicatorAnim, {
      toValue: authMode === "register" ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [authMode, indicatorAnim]);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      const result = await login(email, password);
      const isInstructor = result.user?.role === "INSTRUCTOR";
      const targetTab = isInstructor ? "InstructorTabs" : "MainTabs";

      const redirectTo = route.params?.redirectTo;
      const redirectCourseId = route.params?.courseId;

      if (redirectTo === "CourseDetail") {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: targetTab as any },
              {
                name: "CourseDetail",
                params: { courseId: redirectCourseId },
              },
            ],
          }),
        );
        return;
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetTab as any }],
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Đăng nhập thất bại.";
      Alert.alert("Lỗi đăng nhập", message);
    }
  };

  const handleAuthModeChange = (mode: AuthMode): void => {
    setAuthMode(mode);

    if (mode !== "register") {
      setRegisterStep(1);
    }

    if (mode !== "forgot-password") {
      setForgotStep(1);
    }
  };

  const handlePickRegisterCv = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset) {
        return;
      }

      setIsRegisterCvUploading(true);
      const uploadResult = await uploadAuthCvToS3(
        asset.uri,
        asset.name || `cv-${Date.now()}.pdf`,
        asset.mimeType || "application/pdf",
      );

      setRegisterCvFileName(uploadResult.fileName);
      setRegisterCvFileKey(uploadResult.fileKey);
    } catch (error) {
      Alert.alert(
        "Upload thất bại",
        error instanceof Error ? error.message : "Không thể upload CV.",
      );
    } finally {
      setIsRegisterCvUploading(false);
    }
  };

  const handleRegisterRoleChange = (role: RegisterRole): void => {
    setRegisterRole(role);

    if (role === "USER") {
      setRegisterCvFileName("");
      setRegisterCvFileKey("");
    }
  };

  const handleSendRegisterOtp = async (): Promise<void> => {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = registerEmail.trim().toLowerCase();
    const trimmedPassword = registerPassword.trim();
    const trimmedConfirmPassword = registerConfirmPassword.trim();

    if (
      !trimmedFullName ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert(
        "Mật khẩu không khớp",
        "Vui lòng nhập lại mật khẩu xác nhận.",
      );
      return;
    }

    if (registerRole === "INSTRUCTOR" && !registerCvFileKey) {
      Alert.alert(
        "Thiếu CV",
        "Giảng viên cần upload CV dạng PDF trước khi đăng ký.",
      );
      return;
    }

    try {
      setIsRegisterLoading(true);
      await registerUser({
        name: trimmedFullName,
        email: trimmedEmail,
        password: trimmedPassword,
        role: registerRole,
        cvFileKey:
          registerRole === "INSTRUCTOR" ? registerCvFileKey : undefined,
      });
      setRegisterStep(2);
      Alert.alert(
        "Thành công",
        "Tài khoản đã được tạo. Mã OTP đã được gửi đến email của bạn.",
      );
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Không thể tạo tài khoản hoặc gửi OTP. Vui lòng thử lại.",
      );
      Alert.alert("Đăng ký thất bại", message);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleConfirmRegister = async (): Promise<void> => {
    const trimmedEmail = registerEmail.trim().toLowerCase();
    const trimmedOtp = registerOtp.trim();

    if (!trimmedOtp) {
      Alert.alert("Thiếu OTP", "Vui lòng nhập mã OTP 6 chữ số.");
      return;
    }

    try {
      setIsRegisterLoading(true);
      await AuthControllerService.verifyOtp({
        requestBody: {
          email: trimmedEmail,
          otp: trimmedOtp,
        },
      });

      Alert.alert("Thành công", "Đăng ký thành công. Vui lòng đăng nhập.", [
        {
          text: "OK",
          onPress: () => {
            setAuthMode("login");
            setRegisterStep(1);
            setRegisterOtp("");
            setEmail(trimmedEmail);
            setPassword("");
          },
        },
      ]);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Đăng ký thất bại. Vui lòng thử lại.",
      );
      Alert.alert("Lỗi đăng ký", message);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleSendForgotPasswordOtp = async (): Promise<void> => {
    const trimmedEmail = forgotEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert("Thiếu email", "Vui lòng nhập email để khôi phục mật khẩu.");
      return;
    }

    try {
      setIsForgotLoading(true);
      await sendForgotPasswordOtp({ email: trimmedEmail });
      Alert.alert(
        "Đã gửi OTP",
        "Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.",
        [
          {
            text: "OK",
            onPress: () => setForgotStep(2),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Gửi OTP thất bại",
        getApiErrorMessage(error, "Không thể gửi OTP khôi phục mật khẩu."),
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    const trimmedEmail = forgotEmail.trim().toLowerCase();
    const trimmedOtp = forgotOtp.trim();
    const trimmedNewPassword = forgotNewPassword.trim();
    const trimmedConfirmPassword = forgotConfirmPassword.trim();

    if (
      !trimmedEmail ||
      !trimmedOtp ||
      !trimmedNewPassword ||
      !trimmedConfirmPassword
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ thông tin đặt lại mật khẩu.",
      );
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      Alert.alert("Mật khẩu không khớp", "Vui lòng nhập lại mật khẩu mới.");
      return;
    }

    try {
      setIsForgotLoading(true);
      await resetUserPassword({
        email: trimmedEmail,
        otp: trimmedOtp,
        newPassword: trimmedNewPassword,
      });

      Alert.alert(
        "Thành công",
        "Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.",
        [
          {
            text: "OK",
            onPress: () => {
              setAuthMode("login");
              setForgotStep(1);
              setForgotOtp("");
              setForgotNewPassword("");
              setForgotConfirmPassword("");
              setPassword("");
              setEmail(trimmedEmail);
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Đặt lại mật khẩu thất bại",
        getApiErrorMessage(error, "Không thể đặt lại mật khẩu."),
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResendRegisterOtp = async (): Promise<void> => {
    const trimmedEmail = registerEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert("Thiếu email", "Vui lòng nhập email đăng ký.");
      return;
    }

    try {
      setIsRegisterLoading(true);
      await AuthControllerService.resendOtp({
        requestBody: { email: trimmedEmail },
      });
      Alert.alert("Đã gửi lại", "Mã OTP mới đã được gửi tới email của bạn.");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Không thể gửi lại OTP. Vui lòng thử lại.",
      );
      Alert.alert("Gửi lại OTP thất bại", message);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center px-4 py-8"
          keyboardShouldPersistTaps="handled"
        >
        <View className="w-full max-w-[420px] overflow-hidden rounded-[40px] border border-white/70 bg-white/20 backdrop-blur-lg">
          <BlurView intensity={20} tint="extraLight" style={styles.blurFill} />
          <View className="bg-white/10 p-6 backdrop-blur-md">
            <View className="items-center mb-8">
              <Logo />
              <Text className="mt-1 text-sm font-medium text-muted">
                Học tập không giới hạn
              </Text>
            </View>

            {authMode !== "forgot-password" ? (
              <View
                className="mb-6 rounded-2xl bg-slate-200/40 p-1 flex-row"
                onLayout={(event) => {
                  setSwitcherWidth(event.nativeEvent.layout.width);
                }}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateX: indicatorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.max(0, switcherWidth / 2 - 4)],
                        }),
                      },
                    ],
                    width: Math.max(0, switcherWidth / 2 - 4),
                  }}
                  className="absolute left-1 top-1 bottom-1 rounded-xl bg-white"
                />
                <Pressable
                  className="flex-1 items-center py-3"
                  onPress={() => handleAuthModeChange("login")}
                >
                  <Text
                    className={`text-sm font-bold ${
                      authMode === "login" ? "text-dark" : "text-muted"
                    }`}
                  >
                    Đăng nhập
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 items-center py-3"
                  onPress={() => handleAuthModeChange("register")}
                >
                  <Text
                    className={`text-sm font-bold ${
                      authMode === "register" ? "text-dark" : "text-muted"
                    }`}
                  >
                    Đăng ký
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View>
              {authMode === "login" ? (
                <View className="gap-5">
                  <CustomInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email của bạn"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    leftIcon={
                      <Ionicons name="mail-outline" size={20} color="#64748b" />
                    }
                  />
                  <CustomInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mật khẩu"
                    secureTextEntry={!showLoginPassword}
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#64748b"
                      />
                    }
                    rightIcon={
                      <Ionicons
                        name={
                          showLoginPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color="#64748b"
                      />
                    }
                    onPressRightIcon={() =>
                      setShowLoginPassword((prev) => !prev)
                    }
                  />

                  <Pressable
                    className="self-end"
                    onPress={() => {
                      setForgotEmail(email.trim().toLowerCase());
                      setForgotStep(1);
                      handleAuthModeChange("forgot-password");
                    }}
                  >
                    <Text className="px-1 py-2 text-xs font-bold text-primary">
                      Quên mật khẩu?
                    </Text>
                  </Pressable>

                  <CustomButton
                    title="Đăng nhập"
                    onPress={handleLogin}
                    isLoading={isLoading}
                    className="rounded-2xl"
                  />
                </View>
              ) : (
                <View className="gap-5">
                  {authMode === "register" ? (
                    registerStep === 1 ? (
                      <>
                        <CustomInput
                          value={fullName}
                          onChangeText={setFullName}
                          placeholder="Họ và tên"
                          autoCapitalize="words"
                          leftIcon={
                            <Ionicons
                              name="person-outline"
                              size={20}
                              color="#64748b"
                            />
                          }
                        />

                        <View className="gap-2">
                          <Text className="px-1 text-xs font-bold text-slate-700">
                            Bạn muốn đăng ký với vai trò nào?
                          </Text>
                          <View className="flex-row gap-3">
                            <Pressable
                              className={`flex-1 rounded-2xl border px-4 py-3 ${
                                registerRole === "USER"
                                  ? "border-primary bg-primary/10"
                                  : "border-white/80 bg-white/60"
                              }`}
                              onPress={() => handleRegisterRoleChange("USER")}
                            >
                              <Text className="text-center text-sm font-bold text-slate-800">
                                Học viên
                              </Text>
                            </Pressable>
                            <Pressable
                              className={`flex-1 rounded-2xl border px-4 py-3 ${
                                registerRole === "INSTRUCTOR"
                                  ? "border-primary bg-primary/10"
                                  : "border-white/80 bg-white/60"
                              }`}
                              onPress={() =>
                                handleRegisterRoleChange("INSTRUCTOR")
                              }
                            >
                              <Text className="text-center text-sm font-bold text-slate-800">
                                Giảng viên
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        <CustomInput
                          value={registerEmail}
                          onChangeText={setRegisterEmail}
                          placeholder="Email"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          leftIcon={
                            <Ionicons
                              name="mail-outline"
                              size={20}
                              color="#64748b"
                            />
                          }
                        />
                        <CustomInput
                          value={registerPassword}
                          onChangeText={setRegisterPassword}
                          placeholder="Tạo mật khẩu"
                          secureTextEntry={!showRegisterPassword}
                          leftIcon={
                            <Ionicons
                              name="lock-closed-outline"
                              size={20}
                              color="#64748b"
                            />
                          }
                          rightIcon={
                            <Ionicons
                              name={
                                showRegisterPassword
                                  ? "eye-off-outline"
                                  : "eye-outline"
                              }
                              size={20}
                              color="#64748b"
                            />
                          }
                          onPressRightIcon={() =>
                            setShowRegisterPassword((prev) => !prev)
                          }
                        />
                        <CustomInput
                          value={registerConfirmPassword}
                          onChangeText={setRegisterConfirmPassword}
                          placeholder="Nhập lại mật khẩu"
                          secureTextEntry={!showRegisterConfirmPassword}
                          leftIcon={
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color="#64748b"
                            />
                          }
                          rightIcon={
                            <Ionicons
                              name={
                                showRegisterConfirmPassword
                                  ? "eye-off-outline"
                                  : "eye-outline"
                              }
                              size={20}
                              color="#64748b"
                            />
                          }
                          onPressRightIcon={() =>
                            setShowRegisterConfirmPassword((prev) => !prev)
                          }
                        />

                        {registerRole === "INSTRUCTOR" ? (
                          <View className="gap-2 rounded-2xl border border-violet-100 bg-violet-50/90 px-4 py-4">
                            <Text className="text-sm font-bold text-violet-900">
                              Upload CV (PDF)
                            </Text>
                            <Text className="text-xs font-medium text-violet-700">
                              Giảng viên cần đính kèm CV để hoàn tất đăng ký.
                            </Text>
                            <Pressable
                              className="h-11 items-center justify-center rounded-2xl bg-violet-600"
                              onPress={() => {
                                void handlePickRegisterCv();
                              }}
                              disabled={isRegisterCvUploading}
                            >
                              <Text className="text-sm font-bold text-white">
                                {isRegisterCvUploading
                                  ? "Đang upload CV..."
                                  : registerCvFileName
                                    ? "Đổi file CV"
                                    : "Chọn CV PDF"}
                              </Text>
                            </Pressable>
                            {registerCvFileName ? (
                              <Text className="text-xs font-semibold text-violet-900">
                                Đã chọn: {registerCvFileName}
                              </Text>
                            ) : null}
                          </View>
                        ) : null}

                        <CustomButton
                          title="Đăng ký"
                          onPress={handleSendRegisterOtp}
                          isLoading={isRegisterLoading}
                          className="rounded-2xl"
                        />
                      </>
                    ) : (
                      <>
                        <View className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
                          <Text className="text-sm font-medium text-violet-900">
                            Mã xác nhận gồm 6 chữ số đã được gửi tới email{" "}
                            <Text className="font-bold">{registerEmail}</Text>.
                          </Text>
                        </View>
                        <CustomInput
                          value={registerOtp}
                          onChangeText={setRegisterOtp}
                          placeholder="Nhập mã OTP"
                          keyboardType="number-pad"
                          leftIcon={
                            <Ionicons
                              name="key-outline"
                              size={20}
                              color="#64748b"
                            />
                          }
                        />
                        <CustomButton
                          title="Xác nhận & Hoàn tất"
                          onPress={handleConfirmRegister}
                          isLoading={isRegisterLoading}
                          className="rounded-2xl"
                        />
                        <Pressable
                          className="self-center"
                          onPress={() => {
                            void handleResendRegisterOtp();
                          }}
                          disabled={isRegisterLoading}
                        >
                          <Text className="px-1 py-2 text-xs font-bold text-primary">
                            Gửi lại OTP
                          </Text>
                        </Pressable>
                        <Pressable
                          className="self-center"
                          onPress={() => setRegisterStep(1)}
                          disabled={isRegisterLoading}
                        >
                          <Text className="px-1 py-2 text-xs font-bold text-primary">
                            Quay lại chỉnh sửa thông tin
                          </Text>
                        </Pressable>
                      </>
                    )
                  ) : (
                    <>
                      <View className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 gap-3">
                        <View>
                          <Text className="text-lg font-black text-slate-900">
                            Khôi phục mật khẩu
                          </Text>
                          <Text className="mt-1 text-xs font-medium text-slate-600">
                            Nhập email để nhận OTP, sau đó đặt lại mật khẩu mới.
                          </Text>
                        </View>

                        {forgotStep === 1 ? (
                          <>
                            <CustomInput
                              value={forgotEmail}
                              onChangeText={setForgotEmail}
                              placeholder="Email tài khoản"
                              autoCapitalize="none"
                              keyboardType="email-address"
                              leftIcon={
                                <Ionicons
                                  name="mail-outline"
                                  size={20}
                                  color="#64748b"
                                />
                              }
                            />
                            <CustomButton
                              title="Gửi OTP khôi phục"
                              onPress={handleSendForgotPasswordOtp}
                              isLoading={isForgotLoading}
                              className="rounded-2xl"
                            />
                            <Pressable
                              className="self-center"
                              onPress={() => handleAuthModeChange("login")}
                            >
                              <Text className="px-1 py-2 text-xs font-bold text-primary">
                                Quay lại đăng nhập
                              </Text>
                            </Pressable>
                          </>
                        ) : (
                          <>
                            <CustomInput
                              value={forgotOtp}
                              onChangeText={setForgotOtp}
                              placeholder="Nhập OTP"
                              keyboardType="number-pad"
                              leftIcon={
                                <Ionicons
                                  name="key-outline"
                                  size={20}
                                  color="#64748b"
                                />
                              }
                            />
                            <CustomInput
                              value={forgotNewPassword}
                              onChangeText={setForgotNewPassword}
                              placeholder="Mật khẩu mới"
                              secureTextEntry={!showForgotNewPassword}
                              leftIcon={
                                <Ionicons
                                  name="lock-closed-outline"
                                  size={20}
                                  color="#64748b"
                                />
                              }
                              rightIcon={
                                <Ionicons
                                  name={
                                    showForgotNewPassword
                                      ? "eye-off-outline"
                                      : "eye-outline"
                                  }
                                  size={20}
                                  color="#64748b"
                                />
                              }
                              onPressRightIcon={() =>
                                setShowForgotNewPassword((prev) => !prev)
                              }
                            />
                            <CustomInput
                              value={forgotConfirmPassword}
                              onChangeText={setForgotConfirmPassword}
                              placeholder="Nhập lại mật khẩu mới"
                              secureTextEntry={!showForgotConfirmPassword}
                              leftIcon={
                                <Ionicons
                                  name="checkmark-circle-outline"
                                  size={20}
                                  color="#64748b"
                                />
                              }
                              rightIcon={
                                <Ionicons
                                  name={
                                    showForgotConfirmPassword
                                      ? "eye-off-outline"
                                      : "eye-outline"
                                  }
                                  size={20}
                                  color="#64748b"
                                />
                              }
                              onPressRightIcon={() =>
                                setShowForgotConfirmPassword((prev) => !prev)
                              }
                            />
                            <CustomButton
                              title="Đặt lại mật khẩu"
                              onPress={handleResetPassword}
                              isLoading={isForgotLoading}
                              className="rounded-2xl"
                            />
                            <Pressable
                              className="self-center"
                              onPress={() => {
                                void handleSendForgotPasswordOtp();
                              }}
                              disabled={isForgotLoading}
                            >
                              <Text className="px-1 py-2 text-xs font-bold text-primary">
                                Gửi lại OTP
                              </Text>
                            </Pressable>
                            <Pressable
                              className="self-center"
                              onPress={() => setForgotStep(1)}
                              disabled={isForgotLoading}
                            >
                              <Text className="px-1 py-2 text-xs font-bold text-primary">
                                Đổi email khác
                              </Text>
                            </Pressable>
                          </>
                        )}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>

            <Text className="mt-8  text-center text-[11px] leading-5 text-muted">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo
              mật.
            </Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollGlassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  scrollGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    borderRadius: 24,
  },
});
