/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListQuizQuestionAnalyticsResponse } from '../models/ApiResponseListQuizQuestionAnalyticsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InstructorLearningControllerService {
    /**
     * Get analytical statistics for a quiz
     * @returns ApiResponseListQuizQuestionAnalyticsResponse OK
     * @throws ApiError
     */
    public static getQuizAnalytics({
        quizId,
    }: {
        quizId: string,
    }): CancelablePromise<ApiResponseListQuizQuestionAnalyticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instructor/quizzes/{quizId}/analytics',
            path: {
                'quizId': quizId,
            },
        });
    }
}
