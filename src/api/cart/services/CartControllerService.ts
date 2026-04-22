/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddToCartRequest } from '../models/AddToCartRequest';
import type { ApiResponseListCartItemResponse } from '../models/ApiResponseListCartItemResponse';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CartControllerService {
    /**
     * @returns ApiResponseListCartItemResponse OK
     * @throws ApiError
     */
    public static getCart(): CancelablePromise<ApiResponseListCartItemResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/cart',
        });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static addToCart({
        requestBody,
    }: {
        requestBody: AddToCartRequest,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/cart',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static removeFromCart({
        itemId,
    }: {
        itemId: string,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cart/{itemId}',
            path: {
                'itemId': itemId,
            },
        });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static removeFromCart1({
        itemIds,
    }: {
        itemIds: Array<string>,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cart/ids',
            query: {
                'itemIds': itemIds,
            },
        });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static clearCart(): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/cart/clear',
        });
    }
}
