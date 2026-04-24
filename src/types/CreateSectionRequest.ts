/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateLessonRequest } from './CreateLessonRequest';
export type CreateSectionRequest = {
    title?: string;
    description?: string;
    duration?: number;
    orderIndex?: number;
    lessons?: Array<CreateLessonRequest>;
};

