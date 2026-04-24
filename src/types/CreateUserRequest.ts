/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateUserRequest = {
    userId: string;
    name: string;
    email: string;
    role?: 'USER' | 'INSTRUCTOR' | 'ADMIN';
    gender?: 'MALE' | 'FEMALE';
};

