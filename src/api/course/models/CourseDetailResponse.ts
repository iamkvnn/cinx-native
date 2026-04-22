/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponse } from './CategoryResponse';
import type { CourseImageResponse } from './CourseImageResponse';
import type { InstructorResponse } from './InstructorResponse';
import type { SectionResponse } from './SectionResponse';
export type CourseDetailResponse = {
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
    isPublished?: boolean;
    isInSubscription?: boolean;
    duration?: number;
    hasCertificate?: boolean;
    certificateTitle?: string;
    createdAt?: string;
    updatedAt?: string;
    sections?: Array<SectionResponse>;
};

