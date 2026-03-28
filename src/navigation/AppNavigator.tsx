import type { ReactElement } from "react";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Import Screens
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/main/HomeScreen";
import MyLearningScreen from "../screens/main/MyLearningScreen";
import CartScreen from "../screens/ecommerce/CartScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import CourseDetailScreen from "../screens/course/CourseDetailScreen";
import CheckoutScreen from "../screens/ecommerce/CheckoutScreen";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  CourseDetail: { courseId?: string };
  Checkout: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MyLearning: undefined;
  Cart: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Khám Phá",
          tabBarLabel: "Khám Phá",
        }}
      />
      <Tab.Screen
        name="MyLearning"
        component={MyLearningScreen}
        options={{
          title: "Học Tập",
          tabBarLabel: "Học Tập",
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Giỏ Hàng",
          tabBarLabel: "Giỏ Hàng",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Hồ Sơ",
          tabBarLabel: "Hồ Sơ",
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
    </RootStack.Navigator>
  );
}
