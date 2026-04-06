import type { ReactNode } from "react";
import { useState, type ReactElement } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";

interface CustomInputProps extends TextInputProps {
  secureTextEntry?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPressRightIcon?: () => void;
  containerClassName?: string;
}

export default function CustomInput({
  secureTextEntry = false,
  className = "",
  leftIcon,
  rightIcon,
  onPressRightIcon,
  containerClassName = "",
  ...props
}: CustomInputProps): ReactElement {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`w-full h-14 rounded-2xl bg-white/55 px-4 flex-row items-center ${containerClassName}`}
      style={{
        borderColor: isFocused ? "#4F46E5" : "transparent",
        borderWidth: isFocused ? 1 : 0,
      }}
    >
      {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

      <TextInput
        {...props}
        secureTextEntry={secureTextEntry}
        className={`flex-1 text-base text-dark py-0 ${className}`}
        placeholderTextColor="#6B7280"
        onFocus={(event) => {
          setIsFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          props.onBlur?.(event);
        }}
      />

      {rightIcon ? (
        <Pressable onPress={onPressRightIcon} className="ml-2.5" hitSlop={8}>
          {rightIcon}
        </Pressable>
      ) : null}
    </View>
  );
}
