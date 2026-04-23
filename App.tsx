import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "./global.css";
import AppNavigator from "./src/navigation/AppNavigator";
import type { RootStackParamList } from "./src/navigation/AppNavigator";

const queryClient = new QueryClient();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App(): ReactElement {

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
