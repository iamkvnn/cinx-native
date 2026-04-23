/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponse } from './CategoryResponse';
import type { CourseImageResponse } from './CourseImageResponse';
import type { InstructorResponse } from './InstructorResponse';
export type CourseResponse = {
    id?: string;
    title?: string;
    description?: string;
    category?: CategoryResponse;
    instructor?: InstructorResponse;
    images?: Array<CourseImageResponse>;
    price?: number;
    discountedPrice?: number;
    discountRate?: number;
    rating?: number;
    enrollmentCount?: number;
    isInSubscription?: boolean;
    duration?: number;
    hasCertificate?: boolean;
    certificateTitle?: string;
    status?: 'DRAFT' | 'WAITING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
    createdAt?: string;
    updatedAt?: string;
};

