import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Animated,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../../navigation/AppNavigator";
import { loginMock } from "../../services/api/authApi";
import { useAuthStore } from "../../store/useAuthStore";
import CustomButton from "../../components/ui/CustomButton";
import CustomInput from "../../components/ui/CustomInput";

const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

export default function LoginScreen(): ReactElement {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("23110119@student.hcmute.edu.vn");
  const [password, setPassword] = useState("123456");
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);
  const [switcherWidth, setSwitcherWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(true);

      const response = await loginMock(email, password);
      const { accessToken, refreshToken } = response.data;

      await AsyncStorage.multiSet([
        [ACCESS_TOKEN_STORAGE_KEY, accessToken],
        [REFRESH_TOKEN_STORAGE_KEY, refreshToken],
      ]);

      login(accessToken, refreshToken);
      navigation.replace("MainTabs");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Đăng nhập thất bại.";
      Alert.alert("Lỗi đăng nhập", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="absolute -top-24 -left-20 h-72 w-72 overflow-hidden rounded-full">
        <View className="absolute inset-0 rounded-full bg-blue-200/60" />
      </View>
      <View className="absolute top-28 -right-24 h-80 w-80 overflow-hidden rounded-full">
        <View className="absolute inset-0 rounded-full bg-violet-200/60" />
      </View>
      <View className="absolute -bottom-24 left-16 h-72 w-72 overflow-hidden rounded-full">
        <View className="absolute inset-0 rounded-full bg-fuchsia-200/60" />
      </View>

      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center px-4 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[420px] overflow-hidden rounded-[40px] border border-white/70 bg-white/20 backdrop-blur-lg">
          <BlurView intensity={20} tint="extraLight" style={styles.blurFill} />
          <View className="bg-white/20 p-6 backdrop-blur-md">
            <View className="items-center mb-8">
              <Image
                source={require("../../assets/images/logo.png")}
                className="h-12 w-56"
                resizeMode="contain"
              />
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
                onPress={() => setAuthMode("login")}
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
                onPress={() => setAuthMode("register")}
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
                      <Ionicons name="mail-outline" size={20} color="#64748b" />
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
                    title="Tạo tài khoản"
                    onPress={() => undefined}
                    className="rounded-2xl"
                  />
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
