import { Ionicons } from "@expo/vector-icons";
import { type ReactElement } from "react";
import { Pressable, StyleSheet } from "react-native";

type ExploreFilterButtonProps = {
  onPress: () => void;
};

export default function ExploreFilterButton({
  onPress,
}: ExploreFilterButtonProps): ReactElement {
  return (
    <Pressable
      style={styles.searchShell}
      className="h-12 w-12 items-center justify-center rounded-2xl"
      onPress={onPress}
    >
      <Ionicons name="options-outline" size={18} color="#475569" />
    </Pressable>
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
