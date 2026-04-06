import { ApiResponseQuizSessionResponse, ChooseQuizAnswerRequest, PaginatedApiResponseQuizSessionQuestionResponse, PaginatedApiResponseQuizSessionResponse, SubmitQuizSessionRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class QuizSessionControllerService {
    /**
     * @returns PaginatedApiResponseQuizSessionResponse OK
     * @throws ApiError
     */
    public static getQuizSessions({
        quizLessonId,
        userId,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        quizLessonId: string,
        userId?: string,
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): Promise<PaginatedApiResponseQuizSessionResponse> {
        return axiosClient.get('/api/v1/learning/quiz-sessions', {
            params: {
                'userId': userId,
                'quizLessonId': quizLessonId,
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseQuizSessionResponse OK
     * @throws ApiError
     */
    public static createQuizSession({
        quizLessonId,
    }: {
        quizLessonId: string,
    }): Promise<ApiResponseQuizSessionResponse> {
        return axiosClient.post('/api/v1/learning/quiz-sessions?quizLessonId=' + quizLessonId);
    }
    /**
     * @returns ApiResponseQuizSessionResponse OK
     * @throws ApiError
     */
    public static submitQuizSession({
        quizSessionId,
        requestBody,
    }: {
        quizSessionId: string,
        requestBody: SubmitQuizSessionRequest,
    }): Promise<ApiResponseQuizSessionResponse> {
        return axiosClient.post(`/api/v1/learning/quiz-sessions/${quizSessionId}/submit`, requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static chooseQuizSessionQuestion({
        quizSessionId,
        requestBody,
    }: {
        quizSessionId: string,
        requestBody: ChooseQuizAnswerRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post(`/api/v1/learning/quiz-sessions/${quizSessionId}/choose`, requestBody);
    }
    /**
     * @returns ApiResponseQuizSessionResponse OK
     * @throws ApiError
     */
    public static getQuizSession({
        quizSessionId,
    }: {
        quizSessionId: string,
    }): Promise<ApiResponseQuizSessionResponse> {
        return axiosClient.get(`/api/v1/learning/quiz-sessions/${quizSessionId}`);
    }
    /**
     * @returns PaginatedApiResponseQuizSessionQuestionResponse OK
     * @throws ApiError
     */
    public static getQuizSessionQuestions({
        quizSessionId,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        quizSessionId: string,
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): Promise<PaginatedApiResponseQuizSessionQuestionResponse> {
        return axiosClient.get(`/api/v1/learning/quiz-sessions/${quizSessionId}/questions`, {
            params: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            }
        });
    }
}
