/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCourseDetailResponse } from '../models/ApiResponseCourseDetailResponse';
import type { ApiResponseCourseResponse } from '../models/ApiResponseCourseResponse';
import type { ApiResponseListCourseResponse } from '../models/ApiResponseListCourseResponse';
import type { ApiResponseRejectCourseResponse } from '../models/ApiResponseRejectCourseResponse';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { CreateCourseRequest } from '../models/CreateCourseRequest';
import type { PaginatedApiResponseCourseResponse } from '../models/PaginatedApiResponseCourseResponse';
import type { RejectCourseRequest } from '../models/RejectCourseRequest';
import type { UpdateCourseRequest } from '../models/UpdateCourseRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CourseControllerService {
    /**
     * @returns ApiResponseCourseDetailResponse OK
     * @throws ApiError
     */
    public static getCourseById({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseCourseDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static updateCourse({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateCourseRequest,
    }): CancelablePromise<ApiResponseCourseResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/courses/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static getAllCourses({
        page = 1,
        size = 10,
        query,
        sort,
        rating,
        priceFrom,
        priceTo,
        status,
        categoryId,
        instructorId,
    }: {
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
        rating?: number,
        priceFrom?: number,
        priceTo?: number,
        status?: 'DRAFT' | 'WAITING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED',
        categoryId?: string,
        instructorId?: string,
    }): CancelablePromise<PaginatedApiResponseCourseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses',
            query: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
                'rating': rating,
                'priceFrom': priceFrom,
                'priceTo': priceTo,
                'status': status,
                'categoryId': categoryId,
                'instructorId': instructorId,
            },
        });
    }
    /**
     * @returns ApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static createCourse({
        requestBody,
    }: {
        requestBody: CreateCourseRequest,
    }): CancelablePromise<ApiResponseCourseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Internal API to update course rating
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static updateCourseRating({
        id,
        rating,
    }: {
        id: string,
        rating: number,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses/{id}/update-rating',
            path: {
                'id': id,
            },
            query: {
                'rating': rating,
            },
        });
    }
    /**
     * @returns ApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static rejectCourse({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: RejectCourseRequest,
    }): CancelablePromise<ApiResponseCourseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses/{id}/reject',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static approveCourse({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseCourseResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses/{id}/approve',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseRejectCourseResponse OK
     * @throws ApiError
     */
    public static getRejectReason({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseRejectCourseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/{id}/reject-reason',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseListCourseResponse OK
     * @throws ApiError
     */
    public static getCourseById1({
        ids,
    }: {
        ids: Array<string>,
    }): CancelablePromise<ApiResponseListCourseResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/ids',
            query: {
                'ids': ids,
            },
        });
    }
}
