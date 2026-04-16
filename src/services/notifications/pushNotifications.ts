import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { UserControllerService } from "../api/UserControllerService";

const LAST_PUSH_TOKEN_KEY = "push:lastExpoToken";

export type NotificationNavigationTarget =
  | { screen: "Notifications" }
  | { screen: "CourseDetail"; params: { courseId: string } }
  | { screen: "Checkout"; params: { orderId: string } };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getExpoPushToken = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    return null;
  }

  const permissionStatus = await Notifications.getPermissionsAsync();
  let finalStatus = permissionStatus.status;

  if (finalStatus !== "granted") {
    const requestResult = await Notifications.requestPermissionsAsync();
    finalStatus = requestResult.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const expoPushToken = await Notifications.getExpoPushTokenAsync();
  return expoPushToken.data ?? null;
};

export const registerPushTokenIfNeeded = async (): Promise<void> => {
  const token = await getExpoPushToken();

  if (!token) {
    return;
  }

  const lastToken = await AsyncStorage.getItem(LAST_PUSH_TOKEN_KEY);

  if (lastToken === token) {
    return;
  }

  await UserControllerService.saveDeviceToken({
    requestBody: {
      fcmToken: token,
      deviceInfo: `${Device.osName ?? "unknown"}-${Device.osVersion ?? "unknown"}`,
    },
  });

  await AsyncStorage.setItem(LAST_PUSH_TOKEN_KEY, token);
};

const resolveTargetFromPayload = (
  response: Notifications.NotificationResponse,
): NotificationNavigationTarget => {
  const data =
    (response.notification.request.content.data as
      | Record<string, unknown>
      | undefined) ?? {};

  const targetScreen = String(
    data.screen ?? data.targetScreen ?? "",
  ).toLowerCase();
  const notificationType = String(
    data.type ?? data.notificationType ?? "",
  ).toLowerCase();
  const courseId = String(data.courseId ?? data.entityId ?? "").trim();
  const orderId = String(data.orderId ?? data.paymentOrderId ?? "").trim();

  if (
    (targetScreen === "coursedetail" || targetScreen === "course") &&
    courseId.length > 0
  ) {
    return { screen: "CourseDetail", params: { courseId } };
  }

  if (
    (targetScreen === "checkout" || notificationType.includes("payment")) &&
    orderId.length > 0
  ) {
    return { screen: "Checkout", params: { orderId } };
  }

  return { screen: "Notifications" };
};

export const setupNotificationResponseHandler = (
  onNotificationOpen: (target: NotificationNavigationTarget) => void,
): (() => void) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onNotificationOpen(resolveTargetFromPayload(response));
    },
  );

  return () => {
    subscription.remove();
  };
};

export const setupForegroundNotificationHandler = (
  onReceive: () => void,
): (() => void) => {
  const subscription = Notifications.addNotificationReceivedListener(() => {
    onReceive();
  });

  return () => {
    subscription.remove();
  };
};
