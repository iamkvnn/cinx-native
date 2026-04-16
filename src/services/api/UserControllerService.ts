import {
  ApiResponseObject,
  ApiResponseVoid,
  ApiResponseBoolean,
  ApiResponseListString,
  ApiResponseListUserDto,
  ApiResponseUserDto,
  CreateUserRequest,
  DeviceTokenRequest,
  PaginatedApiResponseUserDto,
  UpdateProfileRequest,
} from "@/types";
import axiosClient from "./axiosClient";

export class UserControllerService {
  /**
   * @returns ApiResponseUserDto OK
   * @throws ApiError
   */
  public static getUserById({
    id,
  }: {
    id: string;
  }): Promise<ApiResponseUserDto> {
    return axiosClient.get(`/api/v1/users/${id}`);
  }
  /**
   * @returns ApiResponseUserDto OK
   * @throws ApiError
   */
  public static updateUser({
    id,
    formData,
  }: {
    id: string;
    formData?: {
      user: UpdateProfileRequest;
      avatar?:
        | Blob
        | {
            uri: string;
            name?: string;
            type?: string;
          };
    };
  }): Promise<ApiResponseUserDto> {
    const multipartFormData = new FormData();

    if (formData?.user) {
      try {
        multipartFormData.append(
          "user",
          new Blob([JSON.stringify(formData.user)], {
            type: "application/json",
          }) as never,
        );
      } catch {
        // Fallback for environments where Blob construction for JSON part is not supported.
        multipartFormData.append("user", JSON.stringify(formData.user));
      }
    }

    if (formData?.avatar) {
      const avatar = formData.avatar as
        | Blob
        | {
            uri: string;
            name?: string;
            type?: string;
          };

      const avatarName =
        typeof avatar === "object" && "name" in avatar && avatar.name
          ? avatar.name
          : "avatar.jpg";

      multipartFormData.append("avatar", avatar as never, avatarName);
    }

    return axiosClient.put(`/api/v1/users/${id}`, multipartFormData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
  /**
   * @returns PaginatedApiResponseUserDto OK
   * @throws ApiError
   */
  public static getAllUsers({
    page = 1,
    size = 10,
    query,
    sort,
  }: {
    page?: number;
    size?: number;
    query?: string;
    sort?: string;
  }): Promise<PaginatedApiResponseUserDto> {
    return axiosClient.get("/api/v1/users", {
      params: {
        page: page,
        size: size,
        query: query,
        sort: sort,
      },
    });
  }
  /**
   * @returns ApiResponseUserDto OK
   * @throws ApiError
   */
  public static createUser({
    requestBody,
  }: {
    requestBody: CreateUserRequest;
  }): Promise<ApiResponseUserDto> {
    return axiosClient.post("/api/v1/users", requestBody);
  }
  /**
   * Add XP to user profile (internal)
   * @returns ApiResponseUserDto OK
   * @throws ApiError
   */
  public static addXp({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }): Promise<ApiResponseUserDto> {
    return axiosClient.post(`/api/v1/users/${userId}/add-xp`, { amount });
  }
  /**
   * @returns ApiResponseObject OK
   * @throws ApiError
   */
  public static verifyInstructor({
    id,
  }: {
    id: string;
  }): Promise<ApiResponseObject> {
    return axiosClient.post(`/api/v1/users/${id}/verify-instructor`);
  }
  /**
   * Save user FCM device token
   * @returns ApiResponseVoid OK
   * @throws ApiError
   */
  public static saveDeviceToken({
    requestBody,
  }: {
    requestBody: DeviceTokenRequest;
  }): Promise<ApiResponseVoid> {
    return axiosClient.post("/api/v1/users/device-tokens", requestBody);
  }
  /**
   * Get user FCM device tokens (internal)
   * @returns ApiResponseListString OK
   * @throws ApiError
   */
  public static getUserTokens({
    userId,
  }: {
    userId: string;
  }): Promise<ApiResponseListString> {
    return axiosClient.get(`/api/v1/users/${userId}/fcm-tokens`);
  }
  /**
   * @returns ApiResponseBoolean OK
   * @throws ApiError
   */
  public static checkInstructorVerified({
    id,
  }: {
    id: string;
  }): Promise<ApiResponseBoolean> {
    return axiosClient.get(`/api/v1/users/${id}/instructor-verified`);
  }
  /**
   * @returns ApiResponseUserDto OK
   * @throws ApiError
   */
  public static getCurrentUser(): Promise<ApiResponseUserDto> {
    return axiosClient.get("/api/v1/users/me");
  }
  /**
   * @returns ApiResponseListUserDto OK
   * @throws ApiError
   */
  public static getUsersByIds({
    ids,
  }: {
    ids: Array<string>;
  }): Promise<ApiResponseListUserDto> {
    return axiosClient.get("/api/v1/users/ids", {
      params: {
        ids: ids,
      },
    });
  }
  /**
   * @returns binary OK
   * @throws ApiError
   */
  public static getAvatarImage({
    fileName,
  }: {
    fileName: string;
  }): Promise<Blob> {
    return axiosClient.get(`/api/v1/users/avatars/${fileName}`, {
      responseType: "blob",
    });
  }
}
