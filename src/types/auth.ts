import type { TokenResponseDto, UserDto } from "@/types";

export type AuthUser = UserDto & {
  id?: string;
  fullName?: string;
  avatar?: string;
  rewardPoints?: number;
  phone?: string;
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
} & Record<string, any>;

export type LoginResult = {
  tokens: TokenResponseDto;
  user: AuthUser | null;
};
