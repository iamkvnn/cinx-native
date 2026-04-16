/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseOrderDetailResponse } from '../models/ApiResponseOrderDetailResponse';
import type { ApiResponseOrderResponse } from '../models/ApiResponseOrderResponse';
import type { CreateOrderRequest } from '../models/CreateOrderRequest';
import type { PaginatedApiResponseOrderDetailResponse } from '../models/PaginatedApiResponseOrderDetailResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrderControllerService {
    /**
     * @returns ApiResponseOrderDetailResponse OK
     * @throws ApiError
     */
    public static cancelOrder({
        orderId,
    }: {
        orderId: string,
    }): CancelablePromise<ApiResponseOrderDetailResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/orders/{orderId}/cancel',
            path: {
                'orderId': orderId,
            },
        });
    }
    /**
     * @returns PaginatedApiResponseOrderDetailResponse OK
     * @throws ApiError
     */
    public static getOrders({
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseOrderDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders',
            query: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseOrderResponse OK
     * @throws ApiError
     */
    public static createOrder({
        requestBody,
    }: {
        requestBody: CreateOrderRequest,
    }): CancelablePromise<ApiResponseOrderResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/orders',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseOrderDetailResponse OK
     * @throws ApiError
     */
    public static getOrderById({
        orderId,
    }: {
        orderId: string,
    }): CancelablePromise<ApiResponseOrderDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/orders/{orderId}',
            path: {
                'orderId': orderId,
            },
        });
    }
}
