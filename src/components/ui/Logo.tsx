import type { ReactElement } from "react";
import { View, Image } from "react-native";

export default function Logo(): ReactElement {
  return (
    <Image
      source={require("../../assets/images/logo.png")}
      className="h-12 w-56"
      resizeMode="contain"
    />
  );
}
