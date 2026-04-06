/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuizOptionRequest } from './CreateQuizOptionRequest';
export type CreateQuizQuestionRequest = {
    questionText?: string;
    questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
    orderIndex?: number;
    options?: Array<CreateQuizOptionRequest>;
};

