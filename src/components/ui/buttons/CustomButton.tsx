import type { ReactElement } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  isLoading = false,
  className = "",
}: CustomButtonProps): ReactElement {
  const disabledClass = disabled || isLoading ? "opacity-60" : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`w-full py-4 px-6 rounded-xl items-center justify-center bg-primary ${disabledClass} ${className}`}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text className="text-base font-semibold text-white">{title}</Text>
      )}
    </TouchableOpacity>
  );
}
