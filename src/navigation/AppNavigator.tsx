import type { ReactElement } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

// Import Screens
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/main/HomeScreen";
import ExploreScreen from "../screens/main/ExploreScreen";
import MyLearningScreen from "../screens/main/MyLearningScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import CourseDetailScreen from "../screens/course/CourseDetailScreen";
import CheckoutScreen from "../screens/ecommerce/CheckoutScreen";
import {
  MyCertificatesScreen,
  DownloadedFilesScreen,
  OrderHistoryScreen,
  VouchersScreen,
  PaymentMethodsScreen,
  HelpCenterScreen,
} from "../screens/profile/ProfileMenuScreens";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  CourseDetail: { courseId?: string };
  Checkout: undefined;
  MyCertificates: undefined;
  DownloadedFiles: undefined;
  OrderHistory: undefined;
  Vouchers: undefined;
  PaymentMethods: undefined;
  HelpCenter: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  MyLearning: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#7958ee",
        tabBarInactiveTintColor: "#64748b",
        tabBarHideOnKeyboard: true,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundContainer}>
            <BlurView
              intensity={60}
              tint="light"
              style={styles.blurFill}
              experimentalBlurMethod="dimezisBlurView"
            />
            <View style={styles.tabBarGlassTint} />
          </View>
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyLearning"
        component={MyLearningScreen}
        options={{
          title: "My learning",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): ReactElement {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{
          title: "Chi Tiết Khóa Học",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: "Thanh Toán",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="MyCertificates"
        component={MyCertificatesScreen}
        options={{
          title: "Chứng chỉ của tôi",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="DownloadedFiles"
        component={DownloadedFilesScreen}
        options={{
          title: "Tài liệu đã tải",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: "Lịch sử đơn hàng",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="Vouchers"
        component={VouchersScreen}
        options={{
          title: "Mã giảm giá",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{
          title: "Phương thức thanh toán",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
      <RootStack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{
          title: "Trung tâm trợ giúp",
          headerShown: true,
          headerTintColor: "#2563eb",
        }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
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
  tabBarBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: 999,
  },
  tabBarGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(233, 234, 237, 0.58)",
    borderRadius: 999,
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
});
