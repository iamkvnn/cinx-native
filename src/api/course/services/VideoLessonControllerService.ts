/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { ApiResponseVideoLessonResponse } from '../models/ApiResponseVideoLessonResponse';
import type { CreateVideoLessonRequest } from '../models/CreateVideoLessonRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VideoLessonControllerService {
    /**
     * @returns ApiResponseVideoLessonResponse OK
     * @throws ApiError
     */
    public static getVideoByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): CancelablePromise<ApiResponseVideoLessonResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/video-lessons',
            query: {
                'lessonId': lessonId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateVideoLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateVideoLessonRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/video-lessons',
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
    public static createVideoLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateVideoLessonRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/video-lessons',
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
    public static deleteVideoLesson({
        lessonId,
    }: {
        lessonId: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/video-lessons',
            query: {
                'lessonId': lessonId,
            },
        });
    }
}
