/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CertificateRequestResponse = {
    id?: string;
    userId?: string;
    courseId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    certificateUrl?: string;
    requestedAt?: string;
    approvedAt?: string;
};

