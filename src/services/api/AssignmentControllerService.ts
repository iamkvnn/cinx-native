import { ApiResponseAssignmentSubmissionResponse, CreateAssignmentSubmissionRequest, PaginatedApiResponseAssignmentSubmissionResponse, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class AssignmentControllerService {
    /**
     * @returns ApiResponseAssignmentSubmissionResponse OK
     * @throws ApiError
     */
    public static getAssignmentSubmission({
        assignmentId,
    }: {
        assignmentId: string,
    }): Promise<ApiResponseAssignmentSubmissionResponse> {
        return axiosClient.get('/api/v1/learning/assignment-submissions', {
            params: {
                'assignmentId': assignmentId,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static submitAssignment({
        assignmentId,
        requestBody,
    }: {
        assignmentId: string,
        requestBody: CreateAssignmentSubmissionRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/learning/assignment-submissions', requestBody, {
            params: {
                'assignmentId': assignmentId,
            }
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static scoreAssignmentSubmission({
        submissionId,
        score,
    }: {
        submissionId: string,
        score: number,
    }): Promise<ApiResponseObject> {
        return axiosClient.post(`/api/v1/learning/assignment-submissions/${submissionId}/score`, { score });
    }
    /**
     * @returns PaginatedApiResponseAssignmentSubmissionResponse OK
     * @throws ApiError
     */
    public static getAssignmentSubmissions({
        assignmentId,
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        assignmentId: string,
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): Promise<PaginatedApiResponseAssignmentSubmissionResponse> {
        return axiosClient.get('/api/v1/learning/assignment-submissions/list', {
            params: {
                'assignmentId': assignmentId,
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static deleteAssignmentSubmission({
        submissionId,
    }: {
        submissionId: string,
    }): Promise<ApiResponseObject> {
        return axiosClient.delete(`/api/v1/learning/assignment-submissions/${submissionId}`);
    }
}
