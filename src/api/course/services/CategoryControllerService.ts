/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListCategoryResponse } from '../models/ApiResponseListCategoryResponse';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CreateCategoryRequest } from '../models/CreateCategoryRequest';
import type { UpdateCategoryRequest } from '../models/UpdateCategoryRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CategoryControllerService {
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateCategory({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateCategoryRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/categories/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseListCategoryResponse OK
     * @throws ApiError
     */
    public static getAllCategories(): CancelablePromise<ApiResponseListCategoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/categories',
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createCategory({
        requestBody,
    }: {
        requestBody: CreateCategoryRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/categories',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
