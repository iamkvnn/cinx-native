import { ApiResponseLearningPathResponse, ApiResponseListLearningPathResponse, LearningPathRequest, ApiResponseVoid } from "@/types";
import axiosClient from "./axiosClient";

export class LearningPathControllerService {
    /**
     * @returns ApiResponseListLearningPathResponse OK
     * @throws ApiError
     */
    public static getLearningPaths(): Promise<ApiResponseListLearningPathResponse> {
        return axiosClient.get('/api/v1/learning-paths');
    }
    /**
     * @returns ApiResponseLearningPathResponse OK
     * @throws ApiError
     */
    public static createLearningPath({
        requestBody,
    }: {
        requestBody: LearningPathRequest,
    }): Promise<ApiResponseLearningPathResponse> {
        return axiosClient.post('/api/v1/learning-paths', requestBody);
    }
    /**
     * @returns ApiResponseLearningPathResponse OK
     * @throws ApiError
     */
    public static getLearningPath({
        id,
    }: {
        id: string,
    }): Promise<ApiResponseLearningPathResponse> {
        return axiosClient.get(`/api/v1/learning-paths/${id}`);
    }
    /**
     * @returns ApiResponseLearningPathResponse OK
     * @throws ApiError
     */
    public static getActiveLearningPath(): Promise<ApiResponseLearningPathResponse> {
        return axiosClient.get('/api/v1/learning-paths/active');
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static dropActiveLearningPath(): Promise<ApiResponseVoid> {
        return axiosClient.delete('/api/v1/learning-paths/active');
    }
}
