import { AddToWishlistRequest, ApiResponseListWishlistItemResponse, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class WishlistControllerService {
    /**
     * @returns ApiResponseListWishlistItemResponse OK
     * @throws ApiError
     */
    public static getWishlist(): Promise<ApiResponseListWishlistItemResponse> {
        return axiosClient.get('/api/v1/wishlist');
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static addToWishlist({
        requestBody,
    }: {
        requestBody: AddToWishlistRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/wishlist', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static removeFromWishlist({
        courseId,
    }: {
        courseId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete('/api/v1/wishlist', {
            params: {
                'courseId': courseId,
            },
        });
    }
}
