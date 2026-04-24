/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseUserStreakResponse } from '../models/ApiResponseUserStreakResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StreakControllerService {
    /**
     * @returns ApiResponseUserStreakResponse OK
     * @throws ApiError
     */
    public static getMyStreak(): CancelablePromise<ApiResponseUserStreakResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/streaks/me',
        });
    }
}
