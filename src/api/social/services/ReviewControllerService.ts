/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListReviewResponse } from '../models/ApiResponseListReviewResponse';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CreateReportReviewRequest } from '../models/CreateReportReviewRequest';
import type { CreateReviewReactionRequest } from '../models/CreateReviewReactionRequest';
import type { CreateReviewRequest } from '../models/CreateReviewRequest';
import type { UpdateReviewRequest } from '../models/UpdateReviewRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/reviews/{reviewId}',
            path: {
                'reviewId': reviewId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteReview({
        reviewId,
    }: {
        reviewId: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/reviews/{reviewId}',
            path: {
                'reviewId': reviewId,
            },
        });
    }
    /**
     * @returns ApiResponseListReviewResponse OK
     * @throws ApiError
     */
    public static getReviewsByCourseId({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseListReviewResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/reviews',
            query: {
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reviews',
            body: requestBody,
            mediaType: 'application/json',
        });
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reviews/{reviewId}/report',
            path: {
                'reviewId': reviewId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/reviews/{reviewId}/react',
            path: {
                'reviewId': reviewId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
