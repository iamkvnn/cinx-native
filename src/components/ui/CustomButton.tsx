import type { ReactElement } from "react";
import { TouchableOpacity, Text } from "react-native";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  className = "",
}: CustomButtonProps): ReactElement {
  const baseClass = "py-3 px-6 rounded-lg items-center justify-center";

  const variantClass = {
    primary: "bg-blue-600",
    secondary: "bg-gray-600",
    outline: "bg-white border border-blue-600",
  }[variant];

  const textColorClass = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-blue-600",
  }[variant];

  const disabledClass = disabled ? "opacity-50" : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${disabledClass} ${className}`}
      activeOpacity={0.7}
    >
      <Text className={`text-base font-semibold ${textColorClass}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
