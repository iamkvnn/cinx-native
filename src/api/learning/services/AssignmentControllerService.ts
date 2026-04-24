/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseAssignmentSubmissionResponse } from '../models/ApiResponseAssignmentSubmissionResponse';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { CreateAssignmentSubmissionRequest } from '../models/CreateAssignmentSubmissionRequest';
import type { PaginatedApiResponseAssignmentSubmissionResponse } from '../models/PaginatedApiResponseAssignmentSubmissionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssignmentControllerService {
    /**
     * @returns ApiResponseAssignmentSubmissionResponse OK
     * @throws ApiError
     */
    public static getAssignmentSubmission({
        assignmentId,
    }: {
        assignmentId: string,
    }): CancelablePromise<ApiResponseAssignmentSubmissionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/assignment-submissions',
            query: {
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/assignment-submissions',
            query: {
                'assignmentId': assignmentId,
            },
            body: requestBody,
            mediaType: 'application/json',
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/learning/assignment-submissions/{submissionId}/score',
            path: {
                'submissionId': submissionId,
            },
            query: {
                'score': score,
            },
        });
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
    }): CancelablePromise<PaginatedApiResponseAssignmentSubmissionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/learning/assignment-submissions/list',
            query: {
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
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/learning/assignment-submissions/{submissionId}',
            path: {
                'submissionId': submissionId,
            },
        });
    }
}
