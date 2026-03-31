import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type ExploreSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
};

export default function ExploreSearchBar({
  value,
  onChangeText,
  onSubmitEditing,
}: ExploreSearchBarProps): ReactElement {
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
        placeholder="Tìm khóa học, tác giả..."
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        className="ml-2 flex-1 py-3.5 text-sm font-semibold text-slate-800"
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
