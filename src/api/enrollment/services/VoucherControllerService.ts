/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { ApiResponseVoucherResponse } from '../models/ApiResponseVoucherResponse';
import type { CreateVoucherRequest } from '../models/CreateVoucherRequest';
import type { PaginatedApiResponseVoucherResponse } from '../models/PaginatedApiResponseVoucherResponse';
import type { UpdateVoucherRequest } from '../models/UpdateVoucherRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VoucherControllerService {
    /**
     * @returns ApiResponseVoucherResponse OK
     * @throws ApiError
     */
    public static getVoucherById({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseVoucherResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/vouchers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateVoucher({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateVoucherRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/vouchers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteVoucher({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/vouchers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedApiResponseVoucherResponse OK
     * @throws ApiError
     */
    public static getVouchers({
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseVoucherResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/vouchers',
            query: {
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
    public static createVoucher({
        requestBody,
    }: {
        requestBody: CreateVoucherRequest,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/vouchers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseVoucherResponse OK
     * @throws ApiError
     */
    public static getVoucherByCode({
        code,
    }: {
        code: string,
    }): CancelablePromise<ApiResponseVoucherResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/vouchers/code',
            query: {
                'code': code,
            },
        });
    }
}
