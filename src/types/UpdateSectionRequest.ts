/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateLessonRequest } from './UpdateLessonRequest';
export type UpdateSectionRequest = {
    id?: string;
    title?: string;
    description?: string;
    duration?: number;
    orderIndex?: number;
    lessons?: Array<UpdateLessonRequest>;
};

