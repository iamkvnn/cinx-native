import { ApiResponsePresignedUrlResponse } from "@/types";
import axiosClient from "./axiosClient";

export class AuthUploadControllerService {
  /**
   * @returns ApiResponsePresignedUrlResponse OK
   * @throws ApiError
   */
  public static getCvPresignedUrl({
    fileName,
    contentType,
  }: {
    fileName: string;
    contentType: string;
  }): Promise<ApiResponsePresignedUrlResponse> {
    return axiosClient.get("/api/v1/auth/upload/presigned-url", {
      params: {
        fileName,
        contentType,
      },
    });
  }
}
