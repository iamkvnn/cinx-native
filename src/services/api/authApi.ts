import type {
  AuthRequestDto,
  RefreshTokenRequest,
  RegisterRequest,
  SendOtpRequest,
  UserDto,
  VerifyEmailRequest,
} from "@/types";

import { AuthControllerService } from "./AuthControllerService";
import { UserControllerService } from "./UserControllerService";
import type { AuthUser, LoginResult } from "../../types/auth";

const mapUser = (user: UserDto | null | undefined): AuthUser | null => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.userId,
    fullName: user.name,
    avatar: user.avatarUrl,
    rewardPoints: user.xp,
    profile: {
      fullName: user.name,
      email: user.email,
      avatar: user.avatarUrl,
    },
  };
};

const getCurrentUserId = async (): Promise<string> => {
  const current = await fetchCurrentUser();
  const userId = current?.id ?? current?.userId;

  if (!userId) {
    throw new Error("Không tìm thấy người dùng hiện tại.");
  }

  return String(userId);
};

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await UserControllerService.getCurrentUser();
  return mapUser(response.data ?? null);
};

export const login = async ({
  email,
  password,
}: AuthRequestDto): Promise<LoginResult["tokens"]> => {
  const response = await AuthControllerService.login({
    requestBody: { email, password },
  });

  const tokens = response.data;

  if (!tokens) {
    throw new Error("Không nhận được token đăng nhập.");
  }

  return tokens;
};

export const sendOtp = async ({
  email,
}: SendOtpRequest & { purpose?: string }): Promise<void> => {
  await AuthControllerService.resendOtp({
    requestBody: { email },
  });
};

export const register = async ({
  email,
  password,
  fullName,
  name,
  role,
  gender,
}: RegisterRequest & {
  fullName?: string;
  name?: string;
}): Promise<void> => {
  const resolvedName = (name ?? fullName ?? "").trim();

  if (!resolvedName) {
    throw new Error("Tên đăng ký không hợp lệ.");
  }

  await AuthControllerService.register({
    requestBody: {
      name: resolvedName,
      email,
      password,
      role: role ?? "USER",
      gender,
    },
  });
};

export const refreshToken = async ({
  token,
}: RefreshTokenRequest): Promise<LoginResult["tokens"]> => {
  const response = await AuthControllerService.refreshToken({
    requestBody: { token },
  });

  const tokens = response.data;

  if (!tokens) {
    throw new Error("Không nhận được token mới.");
  }

  return tokens;
};

export const sendUpdateOtp = async ({
  email,
  phone,
}: {
  email?: string;
  phone?: string;
}): Promise<void> => {
  if (email) {
    await AuthControllerService.sendChangeEmailOtp({
      requestBody: { email },
    });
    return;
  }

  if (phone) {
    throw new Error("Backend mới chưa hỗ trợ đổi số điện thoại.");
  }

  const currentUser = await fetchCurrentUser();

  if (!currentUser?.email) {
    throw new Error("Không tìm thấy email người dùng hiện tại.");
  }

  await AuthControllerService.sendChangePasswordOtp({
    requestBody: { email: currentUser.email },
  });
};

export const updateProfile = async ({
  fullName,
  avatarUri,
  bio,
}: {
  fullName?: string;
  avatarUri?: string;
  bio?: string;
}): Promise<AuthUser> => {
  const currentUserId = await getCurrentUserId();

  let avatarPayload:
    | Blob
    | {
        uri: string;
        name: string;
        type: string;
      }
    | undefined;

  if (avatarUri) {
    const isLocalUri = /^(file|content|ph):\/\//.test(avatarUri);

    if (isLocalUri) {
      avatarPayload = {
        uri: avatarUri,
        name: `avatar-${Date.now()}.jpg`,
        type: "image/jpeg",
      };
    } else {
      try {
        avatarPayload = await (await fetch(avatarUri)).blob();
      } catch {
        throw new Error("Không thể tải ảnh đại diện đã chọn.");
      }
    }
  }

  const userPayload: Record<string, unknown> = {};

  if (fullName !== undefined) {
    userPayload.name = fullName.trim();
  }

  if (bio !== undefined) {
    userPayload.bio = bio;
  }

  const response = await UserControllerService.updateUser({
    id: currentUserId,
    formData: {
      user: userPayload as never,
      avatar: avatarPayload as never,
    },
  });

  const user = mapUser(response.data ?? null);

  if (!user) {
    throw new Error("Không thể cập nhật hồ sơ.");
  }

  return user;
};

export const updateSensitiveInfo = async ({
  otp,
  newEmail,
  newPhone,
  newPassword,
}: {
  otp: string;
  newEmail?: string;
  newPhone?: string;
  newPassword?: string;
}): Promise<AuthUser> => {
  const currentUser = await fetchCurrentUser();

  if (!currentUser?.email) {
    throw new Error("Không tìm thấy thông tin người dùng hiện tại.");
  }

  if (newEmail) {
    await AuthControllerService.changeEmail({
      requestBody: {
        oldEmail: currentUser.email,
        otp,
        newEmail,
      },
    });
  } else if (newPassword) {
    await AuthControllerService.resetPassword({
      requestBody: {
        email: currentUser.email,
        otp,
        newPassword,
      },
    });
  } else if (newPhone) {
    throw new Error("Backend mới chưa hỗ trợ đổi số điện thoại.");
  }

  const refreshedUser = await fetchCurrentUser();

  if (!refreshedUser) {
    throw new Error("Không thể làm mới thông tin người dùng.");
  }

  return refreshedUser;
};
