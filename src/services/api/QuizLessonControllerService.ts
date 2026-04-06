import { ApiResponseQuizLessonResponse, CreateQuizLessonRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class QuizLessonControllerService {
    /**
     * @returns ApiResponseQuizLessonResponse OK
     * @throws ApiError
     */
    public static getQuizByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseQuizLessonResponse> {
        return axiosClient.get('/api/v1/quiz-lessons', {
            params: {
                'lessonId': lessonId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateQuizLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateQuizLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.put('/api/v1/quiz-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createQuizLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateQuizLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/quiz-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteQuizLesson({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete('/api/v1/quiz-lessons', {
            params: {
                'lessonId': lessonId,
            }
        });
    }
}
