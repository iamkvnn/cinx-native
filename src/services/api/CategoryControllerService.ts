import { ApiResponseListCategoryResponse, CreateCategoryRequest, UpdateCategoryRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

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
    }): Promise<ApiResponseObject> {
        return axiosClient.put(`/api/v1/categories/${id}`, requestBody);
    }
    /**
     * @returns ApiResponseListCategoryResponse OK
     * @throws ApiError
     */
    public static getAllCategories(): Promise<ApiResponseListCategoryResponse> {
        return axiosClient.get('/api/v1/categories');
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createCategory({
        requestBody,
    }: {
        requestBody: CreateCategoryRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/categories', requestBody);
    }
}
