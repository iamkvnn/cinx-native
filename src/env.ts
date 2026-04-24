const env = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL?.trim() ?? "https://api.shinyjewelry.shop",
  accessToken:
    process.env.EXPO_PUBLIC_ACCESS_TOKEN_KEY?.trim() ?? "accessToken",
  refreshToken:
    process.env.EXPO_PUBLIC_REFRESH_TOKEN_KEY?.trim() ?? "refreshToken",
};

export default env;
