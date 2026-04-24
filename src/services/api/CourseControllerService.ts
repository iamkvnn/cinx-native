import { ApiResponseCourseDetailResponse, ApiResponseCourseResponse, ApiResponseListCourseResponse, CreateCourseRequest, UpdateCourseRequest, ApiResponseVoid, PaginatedApiResponseCourseResponse } from "@/types";
import axiosClient from "./axiosClient";

export class CourseControllerService {
    /**
     * @returns ApiResponseCourseDetailResponse OK
     * @throws ApiError
     */
    public static getCourseById({
        id,
    }: {
        id: string,
    }): Promise<ApiResponseCourseDetailResponse> {
        return axiosClient.get(`/api/v1/courses/${id}`);
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
    }): Promise<ApiResponseCourseResponse> {
        return axiosClient.put(`/api/v1/courses/${id}`, requestBody);
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
        sortBy,
        status,
        categoryId,
        instructorId,
    }: {
        page?: number,
        size?: number,
        query?: string,
        /**
         * @deprecated Use sortBy (backend expects sortBy)
         */
        sort?: string,
        sortBy?: string,
        status?: 'DRAFT' | 'WAITING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED',
        categoryId?: string,
        instructorId?: string,
    }): Promise<PaginatedApiResponseCourseResponse> {
        return axiosClient.get('/api/v1/courses', {
            params: {
                'page': page,
                'size': size,
                'query': query,
                // Backend uses sortBy, not sort.
                'sortBy': sortBy ?? sort,
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
    }): Promise<ApiResponseCourseResponse> {
        return axiosClient.post('/api/v1/courses', requestBody);
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
    }): Promise<ApiResponseVoid> {
        return axiosClient.post(`/api/v1/courses/${id}/update-rating`, { rating });
    }
    /**
     * @returns ApiResponseListCourseResponse OK
     * @throws ApiError
     */
    public static getCourseById1({
        ids,
    }: {
        ids: Array<string>,
    }): Promise<ApiResponseListCourseResponse> {
        return axiosClient.get('/api/v1/courses/ids', {
            params: {
                'ids': ids,
            },
        });
    }
}
