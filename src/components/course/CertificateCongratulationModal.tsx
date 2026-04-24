import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface CertificateCongratulationModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestCertificate: () => void;
  courseTitle: string;
  isProcessing?: boolean;
}

export default function CertificateCongratulationModal({
  visible,
  onClose,
  onRequestCertificate,
  courseTitle,
  isProcessing = false,
}: CertificateCongratulationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Ionicons name="trophy" size={50} color="#f59e0b" />
            </View>
          </View>

          <Text style={styles.congratsText}>Chúc mừng!</Text>
          <Text style={styles.subText}>
            Bạn đã hoàn thành 100% khóa học:
          </Text>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
          
          <Text style={styles.description}>
            Bạn đủ điều kiện để nhận chứng chỉ cho khóa học này. Hãy gửi yêu cầu ngay để được giảng viên xét duyệt.
          </Text>

          <View style={styles.buttonWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.requestButton,
                pressed && { opacity: 0.8 },
                isProcessing && { backgroundColor: "#94a3b8" }
              ]}
              onPress={onRequestCertificate}
              disabled={isProcessing}
            >
              <Text style={styles.requestButtonText}>
                {isProcessing ? "Đang gửi..." : "Yêu cầu nhận chứng chỉ"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7 }
              ]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Để sau</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    marginTop: -60,
    marginBottom: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#f59e0b",
  },
  congratsText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7c3aed",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  description: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonWrapper: {
    width: "100%",
    gap: 12,
  },
  requestButton: {
    backgroundColor: "#7c3aed",
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});
