/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseLearningPathResponse } from '../models/ApiResponseLearningPathResponse';
import type { ApiResponseListLearningPathResponse } from '../models/ApiResponseListLearningPathResponse';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { LearningPathRequest } from '../models/LearningPathRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LearningPathControllerService {
    /**
     * @returns ApiResponseListLearningPathResponse OK
     * @throws ApiError
     */
    public static getLearningPaths(): CancelablePromise<ApiResponseListLearningPathResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning-paths',
        });
    }
    /**
     * @returns ApiResponseLearningPathResponse OK
     * @throws ApiError
     */
    public static createLearningPath({
        requestBody,
    }: {
        requestBody: LearningPathRequest,
    }): CancelablePromise<ApiResponseLearningPathResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning-paths',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseLearningPathResponse OK
     * @throws ApiError
     */
    public static getLearningPath({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseLearningPathResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning-paths/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseLearningPathResponse OK
     * @throws ApiError
     */
    public static getActiveLearningPath(): CancelablePromise<ApiResponseLearningPathResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning-paths/active',
        });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static dropActiveLearningPath(): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/learning-paths/active',
        });
    }
}
