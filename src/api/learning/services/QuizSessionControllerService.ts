/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { ApiResponseQuizSessionResponse } from '../models/ApiResponseQuizSessionResponse';
import type { ChooseQuizAnswerRequest } from '../models/ChooseQuizAnswerRequest';
import type { PaginatedApiResponseQuizSessionQuestionResponse } from '../models/PaginatedApiResponseQuizSessionQuestionResponse';
import type { PaginatedApiResponseQuizSessionResponse } from '../models/PaginatedApiResponseQuizSessionResponse';
import type { SubmitQuizSessionRequest } from '../models/SubmitQuizSessionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
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
    }): CancelablePromise<PaginatedApiResponseQuizSessionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/quiz-sessions',
            query: {
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
    }): CancelablePromise<ApiResponseQuizSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/quiz-sessions',
            query: {
                'quizLessonId': quizLessonId,
            },
        });
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
    }): CancelablePromise<ApiResponseQuizSessionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/quiz-sessions/{quizSessionId}/submit',
            path: {
                'quizSessionId': quizSessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/quiz-sessions/{quizSessionId}/choose',
            path: {
                'quizSessionId': quizSessionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseQuizSessionResponse OK
     * @throws ApiError
     */
    public static getQuizSession({
        quizSessionId,
    }: {
        quizSessionId: string,
    }): CancelablePromise<ApiResponseQuizSessionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/quiz-sessions/{quizSessionId}',
            path: {
                'quizSessionId': quizSessionId,
            },
        });
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
    }): CancelablePromise<PaginatedApiResponseQuizSessionQuestionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/quiz-sessions/{quizSessionId}/questions',
            path: {
                'quizSessionId': quizSessionId,
            },
            query: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
}
