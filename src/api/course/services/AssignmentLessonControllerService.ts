/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAssignmentLessonResponse } from '../models/ApiResponseAssignmentLessonResponse';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CreateAssignmentLessonRequest } from '../models/CreateAssignmentLessonRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssignmentLessonControllerService {
    /**
     * @returns ApiResponseAssignmentLessonResponse OK
     * @throws ApiError
     */
    public static getAssigmentByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): CancelablePromise<ApiResponseAssignmentLessonResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assignment-lessons',
            query: {
                'lessonId': lessonId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateAssigmentLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateAssignmentLessonRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/assignment-lessons',
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
    public static createAssigmentLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateAssignmentLessonRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/assignment-lessons',
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
    public static deleteAssigmentLesson({
        lessonId,
    }: {
        lessonId: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/assignment-lessons',
            query: {
                'lessonId': lessonId,
            },
        });
    }
}
