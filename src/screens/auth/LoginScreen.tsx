import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Animated,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/AppNavigator";
import AppScreenBackground from "../../components/ui/layout/AppScreenBackground";
import { register as registerApi, sendOtp } from "../../services/api/authApi";
import { useAuthStore } from "../../store/useAuthStore";
import CustomButton from "../../components/ui/buttons/CustomButton";
import CustomInput from "../../components/ui/inputs/CustomInput";
import Logo from "../../components/ui/Logo";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [switcherWidth, setSwitcherWidth] = useState(0);

  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    formAnim.setValue(0);
    Animated.parallel([
      Animated.timing(indicatorAnim, {
        toValue: authMode === "login" ? 0 : 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [authMode, formAnim, indicatorAnim]);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      await login(email, password);

      const redirectTo = route.params?.redirectTo;
      const redirectCourseId = route.params?.courseId;

      if (redirectTo === "CourseDetail") {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: "MainTabs" },
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
          routes: [{ name: "MainTabs" }],
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Đăng nhập thất bại.";
      Alert.alert("Lỗi đăng nhập", message);
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

    try {
      setIsRegisterLoading(true);
      await sendOtp({ email: trimmedEmail, purpose: "REGISTER" });
      setRegisterStep(2);
      Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn.");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Không thể gửi OTP. Vui lòng thử lại.",
      );
      Alert.alert("Gửi OTP thất bại", message);
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleConfirmRegister = async (): Promise<void> => {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = registerEmail.trim().toLowerCase();
    const trimmedPassword = registerPassword.trim();
    const trimmedOtp = registerOtp.trim();

    if (!trimmedOtp) {
      Alert.alert("Thiếu OTP", "Vui lòng nhập mã OTP 6 chữ số.");
      return;
    }

    try {
      setIsRegisterLoading(true);
      await registerApi({
        email: trimmedEmail,
        password: trimmedPassword,
        fullName: trimmedFullName,
        otp: trimmedOtp,
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

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <AppScreenBackground />

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
                onPress={() => {
                  setAuthMode("login");
                  setRegisterStep(1);
                }}
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
                onPress={() => {
                  setAuthMode("register");
                  setRegisterStep(1);
                }}
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

            <Animated.View
              style={{
                opacity: formAnim,
                transform: [
                  {
                    translateX: formAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              }}
            >
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

                  <Pressable className="self-end">
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
                  {registerStep === 1 ? (
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
                        onPress={() => setRegisterStep(1)}
                        disabled={isRegisterLoading}
                      >
                        <Text className="px-1 py-2 text-xs font-bold text-primary">
                          Quay lại chỉnh sửa email
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </Animated.View>

            <View className="mt-8">
              <View className="mb-6 flex-row items-center">
                <View className="h-px flex-1 bg-slate-300/60" />
                <Text className="mx-3 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-muted">
                  Hoặc tiếp tục với
                </Text>
                <View className="h-px flex-1 bg-slate-300/60" />
              </View>

              <View className="flex-row justify-center gap-4">
                <Pressable className="h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/60">
                  <Ionicons name="logo-google" size={20} color="#111827" />
                </Pressable>
                <Pressable className="h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/60">
                  <Ionicons name="logo-apple" size={20} color="#111827" />
                </Pressable>
                <Pressable className="h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/60">
                  <Ionicons name="logo-facebook" size={20} color="#111827" />
                </Pressable>
              </View>
            </View>

            <Text className="mt-8  text-center text-[11px] leading-5 text-muted">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo
              mật.
            </Text>
          </View>
        </View>
      </ScrollView>
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
