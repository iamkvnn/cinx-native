import { ApiResponsePresignedUrlResponse } from "@/types";
import axiosClient from "./axiosClient";

export class PresignedUrlControllerService {
    /**
     * @returns ApiResponsePresignedUrlResponse OK
     * @throws ApiError
     */
    public static getPresignedUrl({
        fileName,
        contentType,
    }: {
        fileName: string,
        contentType: string,
    }): Promise<ApiResponsePresignedUrlResponse> {
        return axiosClient.get('/api/v1/courses/upload/presigned-url', {
            params: {
                'fileName': fileName,
                'contentType': contentType,
            },
        });
    }
}
