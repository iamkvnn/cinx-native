import { ApiResponseCertificateRequestResponse, ApiResponseListCertificateRequestResponse, PaginatedApiResponseCertificateRequestResponse } from "@/types";
import axiosClient from "./axiosClient";

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
    }): Promise<ApiResponseCertificateRequestResponse> {
        return axiosClient.put(`/api/v1/certificates/requests/${requestId}/reject`);
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
    }): Promise<ApiResponseCertificateRequestResponse> {
        return axiosClient.put(`/api/v1/certificates/requests/${requestId}/approve`);
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
    }): Promise<ApiResponseCertificateRequestResponse> {
        return axiosClient.post(`/api/v1/certificates/apply/${courseId}`);
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
    }): Promise<PaginatedApiResponseCertificateRequestResponse> {
        return axiosClient.get('/api/v1/certificates/requests', {
            params: {
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
    }): Promise<PaginatedApiResponseCertificateRequestResponse> {
        return axiosClient.get(`/api/v1/certificates/requests/${courseId}`, {
            params: {
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
    public static getMyCertificates(): Promise<ApiResponseListCertificateRequestResponse> {
        return axiosClient.get('/api/v1/certificates/my-certificates');
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
    }): Promise<ApiResponseCertificateRequestResponse> {
        return axiosClient.get(`/api/v1/certificates/my-certificate/${courseId}`);
    }
}
