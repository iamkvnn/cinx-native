/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignmentSubmissionAttachmentResponse } from './AssignmentSubmissionAttachmentResponse';
export type AssignmentSubmissionResponse = {
    id?: string;
    userId?: string;
    submissionTime?: string;
    assignmentId?: string;
    content?: string;
    score?: number;
    feedback?: string;
    attachments?: Array<AssignmentSubmissionAttachmentResponse>;
};

