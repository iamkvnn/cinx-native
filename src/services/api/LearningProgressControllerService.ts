import axiosClient from "./axiosClient";
import { ApiResponseCourseProgressResponse, ApiResponseListCourseProgressResponse, ApiResponseListLearningItemProgressResponse, ApiResponseObject } from "@/types";

export class LearningProgressControllerService {
    /**
     * Mark an item as complete (e.g. Article)
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static markItemAsComplete({
        itemId,
    }: {
        itemId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.post(`/api/v1/learning/course-progress/items/${itemId}/complete`);
    }
    /**
     * @returns ApiResponseListCourseProgressResponse OK
     * @throws ApiError
     */
    public static getCourseProgressByCourseIds({
        courseIds,
    }: {
        courseIds: Array<string>,
    }): Promise<ApiResponseListCourseProgressResponse> {
        return axiosClient.get('/api/v1/learning/course-progress', {
            params: {
                'courseIds': courseIds,
            },
        });
    }
    /**
     * @returns ApiResponseCourseProgressResponse OK
     * @throws ApiError
     */
    public static getCourseProgress({
        courseId,
    }: {
        courseId: string,
    }): Promise<ApiResponseCourseProgressResponse> {
        return axiosClient.get(`/api/v1/learning/course-progress/${courseId}`);
    }
    /**
     * @returns ApiResponseListLearningItemProgressResponse OK
     * @throws ApiError
     */
    public static getLearningItemProgressByCourseId({
        courseId,
    }: {
        courseId: string,
    }): Promise<ApiResponseListLearningItemProgressResponse> {
        return axiosClient.get(`/api/v1/learning/course-progress/${courseId}/items`);
    }
}
