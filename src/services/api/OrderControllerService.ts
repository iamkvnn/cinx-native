import { ApiResponseOrderDetailResponse, ApiResponseOrderResponse, CreateOrderRequest, PaginatedApiResponseOrderDetailResponse } from "@/types";
import axiosClient from "./axiosClient";

export class OrderControllerService {
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
    }): Promise<PaginatedApiResponseOrderDetailResponse> {
        return axiosClient.get('/api/v1/orders', {
            params: {
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
    }): Promise<ApiResponseOrderResponse> {
        return axiosClient.post('/api/v1/orders', requestBody);
    }
    /**
     * @returns ApiResponseOrderDetailResponse OK
     * @throws ApiError
     */
    public static getOrderById({
        orderId,
    }: {
        orderId: string,
    }): Promise<ApiResponseOrderDetailResponse> {
        return axiosClient.get(`/api/v1/orders/${orderId}`);
    }
}
