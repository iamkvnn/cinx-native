/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuizSessionQuestionResponse = {
    id?: string;
    quizSessionId?: string;
    questionId?: string;
    questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
    questionOrder?: number;
    userAnswer?: string;
    correctAnswer?: string;
    isCorrect?: boolean;
    score?: number;
};

