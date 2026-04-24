import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

type SearchBarProps = Omit<TextInputProps, "value" | "onChangeText"> & {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = "Search...",
  returnKeyType = "search",
  ...props
}: SearchBarProps): ReactElement {
  return (
    <View
      style={styles.searchShell}
      className="flex-1 flex-row items-center rounded-2xl px-3"
    >
      <Ionicons name="search" size={16} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        returnKeyType={returnKeyType}
        className="ml-2 flex-1 py-3.5 text-sm font-semibold text-slate-800"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchShell: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#334155",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },
});
