import { ApiResponseVideoLessonResponse, CreateVideoLessonRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class VideoLessonControllerService {
    /**
     * @returns ApiResponseVideoLessonResponse OK
     * @throws ApiError
     */
    public static getVideoByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseVideoLessonResponse> {
        return axiosClient.get('/api/v1/video-lessons', {
            params: {
                'lessonId': lessonId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateVideoLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateVideoLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.put('/api/v1/video-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createVideoLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateVideoLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/video-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteVideoLesson({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete('/api/v1/video-lessons', {
            params: {
                'lessonId': lessonId,
            },
        });
    }
}
