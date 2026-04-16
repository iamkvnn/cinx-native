import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";
import type { RootStackParamList } from "./src/navigation/AppNavigator";
import {
  setupForegroundNotificationHandler,
  setupNotificationResponseHandler,
} from "./src/services/notifications/pushNotifications";

const queryClient = new QueryClient();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App(): ReactElement {
  useEffect(() => {
    return setupNotificationResponseHandler((target) => {
      if (navigationRef.isReady()) {
        if (target.screen === "Notifications") {
          navigationRef.navigate("Notifications");
          return;
        }

        if (target.screen === "CourseDetail") {
          navigationRef.navigate("CourseDetail", target.params);
          return;
        }

        if (target.screen === "Checkout") {
          navigationRef.navigate("Checkout", target.params);
        }
      }
    });
  }, []);

  useEffect(() => {
    return setupForegroundNotificationHandler(() => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
