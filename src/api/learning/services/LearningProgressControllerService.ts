/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCourseProgressResponse } from '../models/ApiResponseCourseProgressResponse';
import type { ApiResponseListCourseProgressResponse } from '../models/ApiResponseListCourseProgressResponse';
import type { ApiResponseListLearningItemProgressResponse } from '../models/ApiResponseListLearningItemProgressResponse';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LearningProgressControllerService {
    /**
     * Mark an item as complete (e.g. Article)
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static markItemAsComplete({
        itemId,
    }: {
        itemId: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/course-progress/items/{itemId}/complete',
            path: {
                'itemId': itemId,
            },
        });
    }
    /**
     * @returns ApiResponseListCourseProgressResponse OK
     * @throws ApiError
     */
    public static getCourseProgressByCourseIds({
        courseIds,
    }: {
        courseIds: Array<string>,
    }): CancelablePromise<ApiResponseListCourseProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/course-progress',
            query: {
                'courseIds': courseIds,
            },
        });
    }
    /**
     * @returns ApiResponseCourseProgressResponse OK
     * @throws ApiError
     */
    public static getMyCourseProgress({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseCourseProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/course-progress/{courseId}',
            path: {
                'courseId': courseId,
            },
        });
    }
    /**
     * @returns ApiResponseListLearningItemProgressResponse OK
     * @throws ApiError
     */
    public static getLearningItemProgressByCourseId({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseListLearningItemProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/course-progress/{courseId}/items',
            path: {
                'courseId': courseId,
            },
        });
    }
    /**
     * Get detailed progress of a student in a course
     * @returns ApiResponseListLearningItemProgressResponse OK
     * @throws ApiError
     */
    public static getStudentProgress({
        courseId,
        studentId,
    }: {
        courseId: string,
        studentId: string,
    }): CancelablePromise<ApiResponseListLearningItemProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/course-progress/courses/{courseId}/students/{studentId}/progress',
            path: {
                'courseId': courseId,
                'studentId': studentId,
            },
        });
    }
    /**
     * Get overview progress of students in a course
     * @returns ApiResponseListCourseProgressResponse OK
     * @throws ApiError
     */
    public static getCourseProgress({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseListCourseProgressResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/course-progress/courses/{courseId}/progress',
            path: {
                'courseId': courseId,
            },
        });
    }
}
