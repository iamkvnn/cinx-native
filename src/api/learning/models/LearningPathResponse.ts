/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LearningPathItemResponse } from './LearningPathItemResponse';
export type LearningPathResponse = {
    id?: string;
    userId?: string;
    title?: string;
    description?: string;
    status?: 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'DROPPED';
    currentProgress?: number;
    totalItems?: number;
    completedItems?: number;
    items?: Array<LearningPathItemResponse>;
};

