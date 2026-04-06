import { ApiResponseListReviewResponse, CreateReportReviewRequest, CreateReviewReactionRequest, CreateReviewRequest, UpdateReviewRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class ReviewControllerService {
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateReview({
        reviewId,
        requestBody,
    }: {
        reviewId: string,
        requestBody: UpdateReviewRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.put(`/api/v1/reviews/${reviewId}`, requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteReview({
        reviewId,
    }: {
        reviewId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete(`/api/v1/reviews/${reviewId}`);
    }
    /**
     * @returns ApiResponseListReviewResponse OK
     * @throws ApiError
     */
    public static getReviewsByCourseId({
        courseId,
    }: {
        courseId: string,
    }): Promise<ApiResponseListReviewResponse> {
        return axiosClient.get('/api/v1/reviews', {
            params: {
                'courseId': courseId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createReview({
        requestBody,
    }: {
        requestBody: CreateReviewRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/reviews', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static reportReview({
        reviewId,
        requestBody,
    }: {
        reviewId: string,
        requestBody: CreateReportReviewRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post(`/api/v1/reviews/${reviewId}/report`, requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static reactReview({
        reviewId,
        requestBody,
    }: {
        reviewId: string,
        requestBody: CreateReviewReactionRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post(`/api/v1/reviews/${reviewId}/react`, requestBody);
    }
}
