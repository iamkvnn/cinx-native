import type { ReactElement } from "react";
import { useEffect } from "react";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useAuthStore } from "../store/useAuthStore";

// Import Screens
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/main/HomeScreen";
import ExploreScreen from "../screens/main/ExploreScreen";
import MyLearningScreen from "../screens/main/MyLearningScreen";
import { ProfileScreen, PurchaseHistoryScreen } from "../screens/profile";
import CourseDetailScreen from "../screens/course/CourseDetailScreen";
import VideoLessonScreen from "../screens/course/VideoLessonScreen";
import QuizLessonScreen from "../screens/course/QuizLessonScreen";
import AssignmentLessonScreen from "../screens/course/AssignmentLessonScreen";
import ArticleLessonScreen from "../screens/course/ArticleLessonScreen";
import NotificationsScreen from "../screens/profile/NotificationsScreen";
import CartScreen from "../screens/ecommerce/CartScreen";
import CheckoutScreen from "../screens/ecommerce/CheckoutScreen";
import LandingPage from "../screens/landing/LandingPage";
import { fetchCart } from "../services/api/cartApi";
import { NotificationControllerService } from "../services/api/NotificationControllerService";
import { registerPushTokenIfNeeded } from "../services/notifications/pushNotifications";
import {
  MyCertificatesScreen,
  VouchersScreen,
} from "../screens/profile/ProfileMenuScreens";

export type RootStackParamList = {
  Landing: undefined;
  Login:
    | {
        redirectTo?: "CourseDetail";
        courseId?: string;
      }
    | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CourseDetail: { courseId?: string };
  VideoLesson: { lessonId: string; courseId?: string; lessonTitle?: string };
  ArticleLesson: { lessonId: string; courseId?: string; lessonTitle?: string };
  QuizLesson: { lessonId: string; courseId?: string; lessonTitle?: string };
  AssignmentLesson: {
    lessonId: string;
    courseId?: string;
    lessonTitle?: string;
  };
  Cart: undefined;
  Checkout: { orderId?: string };
  MyCertificates: undefined;
  OrderHistory: undefined;
  Notifications: undefined;
  Vouchers: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  MyLearning: undefined;
  Cart: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<MainTabParamList>();

const TAB_ICON_MAP: Record<
  keyof MainTabParamList,
  "home" | "search" | "bookmark" | "cart" | "person"
> = {
  Home: "home",
  Explore: "search",
  MyLearning: "bookmark",
  Cart: "cart",
  Profile: "person",
};

function GlassSwipeTabBar({
  state,
  descriptors,
  navigation,
  cartCount,
  notificationCount,
}: MaterialTopTabBarProps & {
  cartCount: number;
  notificationCount: number;
}): ReactElement {
  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarBackgroundContainer} pointerEvents="none">
        <BlurView
          intensity={60}
          tint="light"
          style={styles.blurFill}
          experimentalBlurMethod="dimezisBlurView"
        />
        <View style={styles.tabBarGlassTint} />
      </View>

      <View style={styles.tabItemsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? "#7958ee" : "#64748b";
          const iconName = TAB_ICON_MAP[route.name as keyof MainTabParamList];
          const { options } = descriptors[route.key];
          const tabBadge =
            route.name === "Cart"
              ? cartCount
              : route.name === "Profile"
                ? notificationCount
                : 0;

          const onPress = (): void => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              style={styles.tabButton}
            >
              <Ionicons name={iconName} size={24} color={color} />
              {tabBadge > 0 ? (
                <View style={styles.tabBadgeTextWrap}>
                  <View style={styles.tabBadgePill}>
                    <Text style={styles.tabBadgeText}>
                      {tabBadge > 99 ? "99+" : tabBadge}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const cartQuery = useQuery({
    queryKey: ["cart", "badge"],
    queryFn: fetchCart,
    enabled: Boolean(user),
    retry: false,
  });
  const unreadNotificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => NotificationControllerService.countUnreadNotifications(),
    enabled: Boolean(user),
    retry: false,
  });
  const cartCount = cartQuery.data?.items?.length || 0;
  const notificationCount = Number(unreadNotificationsQuery.data?.data ?? 0);

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => (
        <GlassSwipeTabBar
          {...props}
          cartCount={cartCount}
          notificationCount={notificationCount}
        />
      )}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: "Explore",
        }}
      />
      <Tab.Screen
        name="MyLearning"
        component={MyLearningScreen}
        options={{
          title: "My learning",
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Cart",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): ReactElement {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      return;
    }

    void registerPushTokenIfNeeded();
  }, [user]);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Group screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen
            name="Cart"
            component={CartScreen}
            options={{
              headerShown: false,
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
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="OrderHistory"
            component={PurchaseHistoryScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen
            name="Vouchers"
            component={VouchersScreen}
            options={{
              headerShown: false,
            }}
          />
        </RootStack.Group>
      ) : (
        <RootStack.Group screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Landing" component={LandingPage} />
          <RootStack.Screen name="Login" component={LoginScreen} />
        </RootStack.Group>
      )}

      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <RootStack.Screen
          name="VideoLesson"
          component={VideoLessonScreen}
          options={{
            headerShown: true,
            title: "Video bài học",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: "#2563eb",
          }}
        />
        <RootStack.Screen
          name="ArticleLesson"
          component={ArticleLessonScreen}
          options={{
            headerShown: true,
            title: "Bài nội dung",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: "#2563eb",
          }}
        />
        <RootStack.Screen
          name="QuizLesson"
          component={QuizLessonScreen}
          options={{
            headerShown: true,
            title: "Bài quiz",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: "#2563eb",
          }}
        />
        <RootStack.Screen
          name="AssignmentLesson"
          component={AssignmentLessonScreen}
          options={{
            headerShown: true,
            title: "Assignment",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: "#2563eb",
          }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
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
  tabItemsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabBadgeTextWrap: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  tabBadgePill: {
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
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
