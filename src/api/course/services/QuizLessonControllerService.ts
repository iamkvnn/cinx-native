/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { ApiResponseQuizLessonResponse } from '../models/ApiResponseQuizLessonResponse';
import type { CreateQuizLessonRequest } from '../models/CreateQuizLessonRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuizLessonControllerService {
    /**
     * @returns ApiResponseQuizLessonResponse OK
     * @throws ApiError
     */
    public static getQuizByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): CancelablePromise<ApiResponseQuizLessonResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/quiz-lessons',
            query: {
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/quiz-lessons',
            query: {
                'lessonId': lessonId,
            },
            body: requestBody,
            mediaType: 'application/json',
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/quiz-lessons',
            query: {
                'lessonId': lessonId,
            },
            body: requestBody,
            mediaType: 'application/json',
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/quiz-lessons',
            query: {
                'lessonId': lessonId,
            },
        });
    }
}
