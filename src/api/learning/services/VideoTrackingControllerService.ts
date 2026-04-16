/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { ApiResponseVideoLessonTrackingHistoryResponse } from '../models/ApiResponseVideoLessonTrackingHistoryResponse';
import type { PaginatedApiResponseVideoLessonTrackingHistoryResponse } from '../models/PaginatedApiResponseVideoLessonTrackingHistoryResponse';
import type { TrackingVideoLessonRequest } from '../models/TrackingVideoLessonRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VideoTrackingControllerService {
    /**
     * @returns PaginatedApiResponseVideoLessonTrackingHistoryResponse OK
     * @throws ApiError
     */
    public static getVideoLessonTrackingHistories({
        videoLessonId,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        videoLessonId: string,
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseVideoLessonTrackingHistoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/video-tracking',
            query: {
                'videoLessonId': videoLessonId,
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static trackVideoProgress({
        requestBody,
    }: {
        requestBody: TrackingVideoLessonRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/video-tracking',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseVideoLessonTrackingHistoryResponse OK
     * @throws ApiError
     */
    public static getVideoLessonTrackingHistory({
        videoLessonId,
    }: {
        videoLessonId: string,
    }): CancelablePromise<ApiResponseVideoLessonTrackingHistoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/video-tracking/history',
            query: {
                'videoLessonId': videoLessonId,
            },
        });
    }
}
