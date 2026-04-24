/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListCheckEnrollmentStatus } from '../models/ApiResponseListCheckEnrollmentStatus';
import type { PaginatedApiResponseCourseResponse } from '../models/PaginatedApiResponseCourseResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EnrollmentControllerService {
    /**
     * @returns ApiResponseListCheckEnrollmentStatus OK
     * @throws ApiError
     */
    public static checkEnrollmentStatus({
        requestBody,
    }: {
        requestBody: Array<string>,
    }): CancelablePromise<ApiResponseListCheckEnrollmentStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/enrollments/check',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static getEnrolledCourses({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): CancelablePromise<PaginatedApiResponseCourseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/enrollments',
            query: {
                'page': page,
                'size': size,
            },
        });
    }
}
