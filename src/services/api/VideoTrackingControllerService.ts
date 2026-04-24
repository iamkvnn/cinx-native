import { ApiResponseObject, ApiResponseVideoLessonTrackingHistoryResponse, PaginatedApiResponseVideoLessonTrackingHistoryResponse, TrackingVideoLessonRequest } from "@/types";
import axiosClient from "./axiosClient";

export class VideoTrackingControllerService {
    /**
     * @returns PaginatedApiResponseVideoLessonTrackingHistoryResponse OK
     * @throws ApiError
     */
    public static getVideoLessonTrackingHistories({
        videoLessonId,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        videoLessonId: string,
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): Promise<PaginatedApiResponseVideoLessonTrackingHistoryResponse> {
        return axiosClient.get('/api/v1/learning/video-tracking', {
            params: {
                'videoLessonId': videoLessonId,
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static trackVideoProgress({
        requestBody,
    }: {
        requestBody: TrackingVideoLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/learning/video-tracking', requestBody);
    }
    /**
     * @returns ApiResponseVideoLessonTrackingHistoryResponse OK
     * @throws ApiError
     */
    public static getVideoLessonTrackingHistory({
        videoLessonId,
    }: {
        videoLessonId: string,
    }): Promise<ApiResponseVideoLessonTrackingHistoryResponse> {
        return axiosClient.get('/api/v1/learning/video-tracking/history', {
            params: {
                'videoLessonId': videoLessonId,
            },
        });
    }
}
