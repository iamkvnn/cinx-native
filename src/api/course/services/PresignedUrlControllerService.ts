/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePresignedUrlResponse } from '../models/ApiResponsePresignedUrlResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PresignedUrlControllerService {
    /**
     * @returns ApiResponsePresignedUrlResponse OK
     * @throws ApiError
     */
    public static getPresignedUrl({
        fileName,
        contentType,
    }: {
        fileName: string,
        contentType: string,
    }): CancelablePromise<ApiResponsePresignedUrlResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/upload/presigned-url',
            query: {
                'fileName': fileName,
                'contentType': contentType,
            },
        });
    }
}
