import { CreateCourseImageRequest, UpdateCourseImageRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class CourseImageControllerService {
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateCourseImage({
        imageId,
        courseId,
        requestBody,
    }: {
        imageId: string,
        courseId: string,
        requestBody: UpdateCourseImageRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.put(`/api/v1/courses/${courseId}/images/${imageId}`, requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteCourseImage({
        imageId,
        courseId,
    }: {
        imageId: string,
        courseId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete(`/api/v1/courses/${courseId}/images/${imageId}`);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static uploadCourseImages({
        courseId,
        requestBody,
    }: {
        courseId: string,
        requestBody: CreateCourseImageRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post(`/api/v1/courses/${courseId}/images`, requestBody);
    }
}
