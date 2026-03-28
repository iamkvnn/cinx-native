import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

type MainTabParamList = {
  Placeholder: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function LoginScreen(): ReactElement {
  return (
    <View style={styles.centeredScreen}>
      <Text style={styles.label}>Login Screen</Text>
    </View>
  );
}

function PlaceholderTabScreen(): ReactElement {
  return (
    <View style={styles.centeredScreen}>
      <Text style={styles.label}>Main Tabs Placeholder</Text>
    </View>
  );
}

function MainTabs(): ReactElement {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Placeholder"
        component={PlaceholderTabScreen}
        options={{ title: "Main" }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): ReactElement {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="MainTabs" component={MainTabs} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flex: 1,
    justifyContent: "center",
  },
  label: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "600",
  },
});
