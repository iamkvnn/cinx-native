/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuizQuestionRequest } from './CreateQuizQuestionRequest';
export type CreateQuizLessonRequest = {
    startTime?: string;
    endTime?: string;
    numberOfQuestionPerQuizSession?: number;
    maxAttempt?: number;
    duration?: number;
    isReviewAllowed?: boolean;
    isShowAnswersOnReview?: boolean;
    questions?: Array<CreateQuizQuestionRequest>;
};

