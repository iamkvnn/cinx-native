import { ApiResponseVoid, ApiResponseListCourseProgressResponse, ApiResponseListLearningItemProgressResponse, ApiResponseListQuizQuestionAnalyticsResponse, PaginatedApiResponseAssignmentSubmissionResponse } from "@/types";
import axiosClient from "./axiosClient";

export class InstructorLearningControllerService {
    /**
     * Grade an assignment submission
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static scoreAssignmentSubmission1({
        submissionId,
        score,
    }: {
        submissionId: string,
        score: number,
    }): Promise<ApiResponseVoid> {
        return axiosClient.post(`/api/v1/instructor/assignments/submissions/${submissionId}/grade`,
            {
                params: {
                    'score': score,
            },
        });
    }
    /**
     * Get analytical statistics for a quiz
     * @returns ApiResponseListQuizQuestionAnalyticsResponse OK
     * @throws ApiError
     */
    public static getQuizAnalytics({
        quizId,
    }: {
        quizId: string,
    }): Promise<ApiResponseListQuizQuestionAnalyticsResponse> {
        return axiosClient.get(`/api/v1/instructor/quizzes/${quizId}/analytics`);
    }
    /**
     * Get detailed progress of a student in a course
     * @returns ApiResponseListLearningItemProgressResponse OK
     * @throws ApiError
     */
    public static getStudentProgress({
        courseId,
        studentId,
    }: {
        courseId: string,
        studentId: string,
    }): Promise<ApiResponseListLearningItemProgressResponse> {
        return axiosClient.get(`/api/v1/instructor/courses/${courseId}/students/${studentId}/progress`);
    }
    /**
     * Get overview progress of students in a course
     * @returns ApiResponseListCourseProgressResponse OK
     * @throws ApiError
     */
    public static getCourseProgress1({
        courseId,
    }: {
        courseId: string,
    }): Promise<ApiResponseListCourseProgressResponse> {
        return axiosClient.get(`/api/v1/instructor/courses/${courseId}/progress`);
    }
    /**
     * Get submissions for an assignment
     * @returns PaginatedApiResponseAssignmentSubmissionResponse OK
     * @throws ApiError
     */
    public static getAssignmentSubmissions1({
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
        return axiosClient.get(`/api/v1/instructor/assignments/${assignmentId}/submissions`, {
            params: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
}
