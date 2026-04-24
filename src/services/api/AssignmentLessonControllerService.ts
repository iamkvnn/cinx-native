import { ApiResponseAssignmentLessonResponse, CreateAssignmentLessonRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class AssignmentLessonControllerService {
    /**
     * @returns ApiResponseAssignmentLessonResponse OK
     * @throws ApiError
     */
    public static getAssigmentByLessonId({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseAssignmentLessonResponse> {
        return axiosClient.get('/api/v1/assignment-lessons', {
            params: {
                'lessonId': lessonId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static updateAssigmentLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateAssignmentLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.put('/api/v1/assignment-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static createAssigmentLesson({
        lessonId,
        requestBody,
    }: {
        lessonId: string,
        requestBody: CreateAssignmentLessonRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/assignment-lessons', requestBody, {
            params: {
                'lessonId': lessonId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteAssigmentLesson({
        lessonId,
    }: {
        lessonId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete('/api/v1/assignment-lessons', {
            params: {
                'lessonId': lessonId,
            }
        });
    }
}
