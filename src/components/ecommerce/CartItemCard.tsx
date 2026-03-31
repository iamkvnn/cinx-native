import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRef, type ReactElement } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

const QUICK_TAP_THRESHOLD_MS = 220;
const SWIPE_PRESS_BLOCK_MS = 280;

export interface CartItemCardData {
  id: number;
  title: string;
  instructorName: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
}

interface CartItemCardProps {
  item: CartItemCardData;
  onPress: (item: CartItemCardData) => void;
  onRemove: (item: CartItemCardData) => Promise<void>;
  onSwipeableWillOpen?: (id: number) => void;
  setSwipeableRef?: (instance: { close: () => void } | null) => void;
}

const formatVnd = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export default function CartItemCard({
  item,
  onPress,
  onRemove,
  onSwipeableWillOpen,
  setSwipeableRef,
}: CartItemCardProps): ReactElement {
  const pressStartTimeRef = useRef(0);
  const pressBlockedUntilRef = useRef(0);
  const swipeActionOpenRef = useRef(false);

  const handleCardPress = (): void => {
    const now = Date.now();
    const pressDuration = now - pressStartTimeRef.current;

    if (pressDuration > QUICK_TAP_THRESHOLD_MS) {
      return;
    }

    if (swipeActionOpenRef.current || now < pressBlockedUntilRef.current) {
      return;
    }

    onPress(item);
  };

  const handleConfirmDelete = (): void => {
    Alert.alert("Xác nhận", "Bạn có muốn xóa khỏi giỏ?", [
      {
        text: "Không",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          void onRemove(item);
        },
      },
    ]);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ): ReactElement => {
    const translateX = dragX.interpolate({
      inputRange: [-120, -20, 0],
      outputRange: [0, 80, 120],
      extrapolate: "clamp",
    });

    const actionOpacity = dragX.interpolate({
      inputRange: [-120, -40, 0],
      outputRange: [1, 0.85, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          width: 120,
          transform: [{ translateX }],
          opacity: actionOpacity,
        }}
        className="mb-4 ml-2 overflow-hidden rounded-3xl border border-red-200/60 bg-red-100/65"
      >
        <BlurView
          intensity={24}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          onPress={handleConfirmDelete}
          className="h-full items-center justify-center bg-red-500/85"
        >
          <Ionicons name="trash-outline" size={20} color="#ffffff" />
          <Text className="mt-1 text-xs font-bold text-white">Xóa</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={setSwipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={24}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => {
        swipeActionOpenRef.current = true;
        pressBlockedUntilRef.current = Date.now() + SWIPE_PRESS_BLOCK_MS;
        onSwipeableWillOpen?.(item.id);
      }}
      onSwipeableWillClose={() => {
        pressBlockedUntilRef.current = Date.now() + SWIPE_PRESS_BLOCK_MS;
      }}
      onSwipeableClose={() => {
        swipeActionOpenRef.current = false;
        pressBlockedUntilRef.current = Date.now() + SWIPE_PRESS_BLOCK_MS;
      }}
    >
      <Pressable
        onPressIn={() => {
          pressStartTimeRef.current = Date.now();
        }}
        onPress={handleCardPress}
        className="mb-4 overflow-hidden rounded-3xl border border-white/85 bg-white/55"
        style={styles.cardShadow}
      >
        <BlurView
          intensity={38}
          tint="light"
          style={StyleSheet.absoluteFillObject}
        />

        <View pointerEvents="none" style={styles.glassTint} />

        <View className="flex-row gap-3 p-3">
          <View className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-200">
            <Image
              source={{ uri: item.imageUrl }}
              resizeMode="cover"
              className="h-full w-full"
            />
          </View>

          <View className="flex-1 justify-between py-0.5">
            <View>
              <Text
                className="mb-1 text-sm font-bold leading-5 text-slate-800"
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text className="text-xs text-slate-500" numberOfLines={1}>
                Bởi{" "}
                <Text className="font-bold text-slate-700">
                  {item.instructorName}
                </Text>
              </Text>
            </View>

            <View className="mt-2 flex-row items-end justify-between">
              <View>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <Text className="text-[10px] font-semibold text-slate-400 line-through">
                    {formatVnd(item.originalPrice)}
                  </Text>
                ) : null}

                <Text className="text-base font-black text-violet-600">
                  {formatVnd(item.price)}
                </Text>
              </View>

              <View className="rounded-full bg-violet-100 px-2.5 py-1">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                  Chi tiết
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5">
          <Ionicons name="chevron-forward" size={14} color="#475569" />
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});
