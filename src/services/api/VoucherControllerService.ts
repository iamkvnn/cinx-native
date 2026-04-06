import { ApiResponseVoucherResponse, CreateVoucherRequest, PaginatedApiResponseVoucherResponse, UpdateVoucherRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class VoucherControllerService {
    /**
     * @returns ApiResponseVoucherResponse OK
     * @throws ApiError
     */
    public static getVoucherById({
        id,
    }: {
        id: string,
    }): Promise<ApiResponseVoucherResponse> {
        return axiosClient.get('/api/v1/vouchers/{id}', {
            params: {
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
    }): Promise<ApiResponseObject> {
        return axiosClient.put('/api/v1/vouchers/{id}', requestBody, {
            params: {
                'id': id,
            }
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
    }): Promise<ApiResponseObject> {
        return axiosClient.delete('/api/v1/vouchers/{id}', {
            params: {
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
    }): Promise<PaginatedApiResponseVoucherResponse> {
        return axiosClient.get('/api/v1/vouchers', {
            params: {
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
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/vouchers', requestBody);
    }
    /**
     * @returns ApiResponseVoucherResponse OK
     * @throws ApiError
     */
    public static getVoucherByCode({
        code,
    }: {
        code: string,
    }): Promise<ApiResponseVoucherResponse> {
        return axiosClient.get('/api/v1/vouchers/code', {
            params: {
                'code': code,
            },
        });
    }
}
