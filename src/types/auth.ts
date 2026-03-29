export interface LoginTokens {
  accessToken: string;
  refreshToken: string;
}

// Postman login test script reads token via res.data.accessToken/res.data.refreshToken.
export interface LoginResponse {
  data: LoginTokens;
}
