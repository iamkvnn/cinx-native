import type {
  UserProfile,
  UserStats,
  MenuItemConfig,
} from "../../types/profile";

export const mockUserProfile: UserProfile = {
  id: "user-001",
  name: "Nguyễn Hoàng Minh",
  email: "minh.nguyen@example.com",
  phone: "0987 654 321",
  avatar: "https://i.pravatar.cc/150?u=nguyen_hoang_minh",
  membershipStatus: "pro",
  joinDate: "2024-01-15",
};

export const mockUserStats: UserStats = {
  streakDays: 12,
  certificatesCount: 3,
  totalXP: 2450,
};

export const mockMenuItems: MenuItemConfig[] = [
  // Learning Category
  {
    id: "my-certificates",
    title: "Chứng chỉ của tôi",
    icon: "star",
    badge: 1,
    color: "orange",
    category: "learning",
    route: "MyCertificates",
  },
  {
    id: "downloaded-files",
    title: "Tài liệu đã tải",
    icon: "cloud-download",
    color: "blue",
    category: "learning",
    route: "DownloadedFiles",
  },
  // Transactions Category
  {
    id: "order-history",
    title: "Lịch sử đơn hàng",
    icon: "receipt",
    color: "violet",
    category: "transactions",
    route: "OrderHistory",
  },
  {
    id: "vouchers",
    title: "Mã giảm giá (Vouchers)",
    icon: "ticket",
    color: "pink",
    category: "transactions",
    route: "Vouchers",
  },
  {
    id: "payment-methods",
    title: "Phương thức thanh toán",
    icon: "card",
    color: "emerald",
    category: "transactions",
    route: "PaymentMethods",
  },
  // Settings Category
  {
    id: "push-notifications",
    title: "Thông báo đẩy",
    icon: "bell",
    color: "indigo",
    category: "settings",
  },
  {
    id: "dark-mode",
    title: "Chế độ tối (Dark Mode)",
    icon: "moon",
    color: "indigo",
    category: "settings",
  },
  {
    id: "language",
    title: "Ngôn ngữ",
    icon: "globe",
    color: "indigo",
    category: "settings",
  },
  // Support Category
  {
    id: "help-center",
    title: "Trung tâm trợ giúp",
    icon: "help-circle",
    color: "indigo",
    category: "support",
    route: "HelpCenter",
  },
];
