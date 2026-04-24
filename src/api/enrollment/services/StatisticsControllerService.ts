/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseDashboardMetricsResponse } from '../models/ApiResponseDashboardMetricsResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StatisticsControllerService {
    /**
     * Get dashboard metrics
     * @returns ApiResponseDashboardMetricsResponse OK
     * @throws ApiError
     */
    public static getDashboardMetrics({
        year,
        month,
    }: {
        year?: number,
        month?: number,
    }): CancelablePromise<ApiResponseDashboardMetricsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/statistics/dashboard',
            query: {
                'year': year,
                'month': month,
            },
        });
    }
}
