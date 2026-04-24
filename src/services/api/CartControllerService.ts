import { AddToCartRequest, ApiResponseListCartItemResponse, ApiResponseVoid } from "@/types";
import axiosClient from "./axiosClient";

export class CartControllerService {
    /**
     * @returns ApiResponseListCartItemResponse OK
     * @throws ApiError
     */
    public static getCart(): Promise<ApiResponseListCartItemResponse> {
        return axiosClient.get('/api/v1/cart');
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static addToCart({
        requestBody,
    }: {
        requestBody: AddToCartRequest,
    }): Promise<ApiResponseVoid> {
        return axiosClient.post('/api/v1/cart', requestBody);
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static removeFromCart({
        itemId,
    }: {
        itemId: string,
    }): Promise<ApiResponseVoid> {
        return axiosClient.delete(`/api/v1/cart/${itemId}`);
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static removeFromCart1({
        itemIds,
    }: {
        itemIds: Array<string>,
    }): Promise<ApiResponseVoid> {
        return axiosClient.delete('/api/v1/cart/ids', { params: { itemIds } });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static clearCart(): Promise<ApiResponseVoid> {
        return axiosClient.delete('/api/v1/cart/clear');
    }
}
