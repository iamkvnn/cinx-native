/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateSectionRequest } from './UpdateSectionRequest';
export type UpdateCourseRequest = {
    title?: string;
    description?: string;
    categoryId?: string;
    price?: number;
    discountedPrice?: number;
    isPublished?: boolean;
    isInSubscription?: boolean;
    duration?: number;
    hasCertificate?: boolean;
    certificateTitle?: string;
    sections?: Array<UpdateSectionRequest>;
};

