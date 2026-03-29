import type { LoginResponse } from "../../types/auth";

const LOGIN_DELAY_MS = 1500;

const mockLoginResponse: LoginResponse = {
  data: {
    accessToken:
      "eyJhbGciOiJIUzI1NiJ9.mock.accessToken.23110119student.hcmute.edu.vn",
    refreshToken:
      "eyJhbGciOiJIUzI1NiJ9.mock.refreshToken.23110119student.hcmute.edu.vn",
  },
};

export const loginMock = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isValidCredential =
        email.trim().toLowerCase() === "23110119@student.hcmute.edu.vn" &&
        password === "123456";

      if (!isValidCredential) {
        reject(new Error("Email hoặc mật khẩu không đúng."));
        return;
      }

      resolve(mockLoginResponse);
    }, LOGIN_DELAY_MS);
  });
};
