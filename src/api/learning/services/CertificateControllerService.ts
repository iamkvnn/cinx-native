/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseCertificateRequestResponse } from '../models/ApiResponseCertificateRequestResponse';
import type { ApiResponseListCertificateRequestResponse } from '../models/ApiResponseListCertificateRequestResponse';
import type { PaginatedApiResponseCertificateRequestResponse } from '../models/PaginatedApiResponseCertificateRequestResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CertificateControllerService {
    /**
     * Reject certificate request (For Instructor)
     * @returns ApiResponseCertificateRequestResponse OK
     * @throws ApiError
     */
    public static rejectCertificate({
        requestId,
    }: {
        requestId: string,
    }): CancelablePromise<ApiResponseCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/certificates/requests/{requestId}/reject',
            path: {
                'requestId': requestId,
            },
        });
    }
    /**
     * Approve certificate request (For Instructor)
     * @returns ApiResponseCertificateRequestResponse OK
     * @throws ApiError
     */
    public static approveCertificate({
        requestId,
    }: {
        requestId: string,
    }): CancelablePromise<ApiResponseCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/certificates/requests/{requestId}/approve',
            path: {
                'requestId': requestId,
            },
        });
    }
    /**
     * Apply for course certificate
     * @returns ApiResponseCertificateRequestResponse OK
     * @throws ApiError
     */
    public static applyForCertificate({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/certificates/apply/{courseId}',
            path: {
                'courseId': courseId,
            },
        });
    }
    /**
     * Get all certificate requests
     * @returns PaginatedApiResponseCertificateRequestResponse OK
     * @throws ApiError
     */
    public static getAllRequests({
        status,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        status?: 'PENDING' | 'APPROVED' | 'REJECTED',
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/certificates/requests',
            query: {
                'status': status,
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * Get certificate requests by course ID (For Instructor)
     * @returns PaginatedApiResponseCertificateRequestResponse OK
     * @throws ApiError
     */
    public static getRequestsByCourse({
        courseId,
        status,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        courseId: string,
        status?: 'PENDING' | 'APPROVED' | 'REJECTED',
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/certificates/requests/{courseId}',
            path: {
                'courseId': courseId,
            },
            query: {
                'status': status,
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * Get all user certificates
     * @returns ApiResponseListCertificateRequestResponse OK
     * @throws ApiError
     */
    public static getMyCertificates(): CancelablePromise<ApiResponseListCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/certificates/my-certificates',
        });
    }
    /**
     * Get user certificate by course
     * @returns ApiResponseCertificateRequestResponse OK
     * @throws ApiError
     */
    public static getMyCertificate({
        courseId,
    }: {
        courseId: string,
    }): CancelablePromise<ApiResponseCertificateRequestResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/certificates/my-certificate/{courseId}',
            path: {
                'courseId': courseId,
            },
        });
    }
}
