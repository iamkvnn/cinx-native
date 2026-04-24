/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CreateCourseImageRequest } from '../models/CreateCourseImageRequest';
import type { UpdateCourseImageRequest } from '../models/UpdateCourseImageRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CourseImageControllerService {
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateCourseImage({
        imageId,
        courseId,
        requestBody,
    }: {
        imageId: string,
        courseId: string,
        requestBody: UpdateCourseImageRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/courses/{courseId}/images/{imageId}',
            path: {
                'imageId': imageId,
                'courseId': courseId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteCourseImage({
        imageId,
        courseId,
    }: {
        imageId: string,
        courseId: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/courses/{courseId}/images/{imageId}',
            path: {
                'imageId': imageId,
                'courseId': courseId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static uploadCourseImages({
        courseId,
        requestBody,
    }: {
        courseId: string,
        requestBody: CreateCourseImageRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses/{courseId}/images',
            path: {
                'courseId': courseId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
