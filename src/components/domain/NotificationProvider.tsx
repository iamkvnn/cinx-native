import React, { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/useAuthStore";

if (typeof TextEncoder !== "function") {
  const TextEncodingPolyfill = require("text-encoding");
  global.TextEncoder = TextEncodingPolyfill.TextEncoder;
  global.TextDecoder = TextEncodingPolyfill.TextDecoder;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
      return;
    }

    const client = new Client({
      brokerURL: 'wss://api.shinyjewelry.shop/ws/notifications',
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        console.log("Connected to WebSocket for notifications");
        client.subscribe("/user/queue/notifications", (message) => {
            console.log("Received notification:", message);
          if (message.body) {
            try {
              const notification = JSON.parse(message.body);
              Toast.show({
                type: "info",
                text1: notification.title || "Thông báo mới",
                text2:
                  notification.message ||
                  notification.content ||
                  "Bạn có một thông báo mới!",
                position: "top",
                visibilityTime: 4000,
                autoHide: true,
              });
            } catch (e) {
              console.error("Error parsing notification", e);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket Error:", event);
      },
    });

    stompClient.current = client;
    client.activate();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
    };
  }, [accessToken, isAuthenticated]);

  return (
    <>
      {children}
      <Toast />
    </>
  );
}
