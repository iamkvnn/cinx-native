// Profile screen type definitions

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membershipStatus: "free" | "pro" | "premium";
  joinDate: string;
}

export interface UserStats {
  streakDays: number;
  certificatesCount: number;
  totalXP: number;
}

export interface MenuItemConfig {
  id: string;
  title: string;
  icon: string;
  badge?: number;
  color: "orange" | "blue" | "pink" | "emerald" | "violet" | "indigo" | "red";
  category: "learning" | "transactions" | "settings" | "support";
  route?: string;
}

export interface UserProfileData {
  profile: UserProfile;
  stats: UserStats;
  menuItems: MenuItemConfig[];
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone: string;
}
