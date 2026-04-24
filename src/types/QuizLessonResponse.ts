/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuizQuestionResponse } from './QuizQuestionResponse';
export type QuizLessonResponse = {
    startTime?: string;
    endTime?: string;
    numberOfQuestionPerQuizSession?: number;
    maxAttempt?: number;
    duration?: number;
    isReviewAllowed?: boolean;
    isShowAnswersOnReview?: boolean;
    questions?: Array<QuizQuestionResponse>;
};

