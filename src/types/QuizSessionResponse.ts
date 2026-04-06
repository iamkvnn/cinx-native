/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { QuizSessionSubmissionResponse } from './QuizSessionSubmissionResponse';
export type QuizSessionResponse = {
    id?: string;
    quizLessonId?: string;
    startTime?: string;
    endTime?: string;
    status?: 'IN_PROGRESS' | 'SUBMITTED' | 'NOT_ATTEMPTED';
    isReviewAllowed?: boolean;
    isShowAnswersOnReview?: boolean;
    quizSessionSubmission?: QuizSessionSubmissionResponse;
};

