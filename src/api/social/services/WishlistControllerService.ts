/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddToWishlistRequest } from '../models/AddToWishlistRequest';
import type { ApiResponseListWishlistItemResponse } from '../models/ApiResponseListWishlistItemResponse';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WishlistControllerService {
    /**
     * @returns ApiResponseListWishlistItemResponse OK
     * @throws ApiError
     */
    public static getWishlist(): CancelablePromise<ApiResponseListWishlistItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/wishlist',
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static addToWishlist({
        requestBody,
    }: {
        requestBody: AddToWishlistRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/wishlist',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static removeFromWishlist({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/wishlist',
            query: {
                'courseId': courseId,
            },
        });
    }
}
