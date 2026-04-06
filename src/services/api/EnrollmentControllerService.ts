import { ApiResponseListCheckEnrollmentStatus, PaginatedApiResponseCourseResponse } from "@/types";
import axiosClient from "./axiosClient";

export class EnrollmentControllerService {
    /**
     * @returns ApiResponseListCheckEnrollmentStatus OK
     * @throws ApiError
     */
    public static checkEnrollmentStatus({
        requestBody,
    }: {
        requestBody: Array<string>,
    }): Promise<ApiResponseListCheckEnrollmentStatus> {
        return axiosClient.post('/api/v1/enrollments/check', requestBody);
    }
    /**
     * @returns PaginatedApiResponseCourseResponse OK
     * @throws ApiError
     */
    public static getEnrolledCourses({
        page = 1,
        size = 10,
    }: {
        page?: number,
        size?: number,
    }): Promise<PaginatedApiResponseCourseResponse> {
        return axiosClient.get('/api/v1/enrollments', {
            params: {
                'page': page,
                'size': size,
            },
        });
    }
}
