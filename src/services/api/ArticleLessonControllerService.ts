import { ApiResponseArticleLessonResponse, CreateArticleLessonRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class ArticleLessonControllerService {
    /**
     * @returns ApiResponseArticleLessonResponse OK
     * @throws ApiError
     */
    public static getArticleByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseArticleLessonResponse> {
        return axiosClient.get('/api/v1/article-lessons',
            {
                params: {
                    'lessonId': lessonId,
                }
            }
        );
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateArticleLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateArticleLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.put('/api/v1/article-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createArticleLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateArticleLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/article-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteArticleLesson({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete('/api/v1/article-lessons', {
            params: {
                'lessonId': lessonId,
            }
        });
    }
}
