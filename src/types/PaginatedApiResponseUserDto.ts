/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedMetadata } from './PaginatedMetadata';
import type { UserDto } from './UserDto';
export type PaginatedApiResponseUserDto = {
    success?: boolean;
    message?: string;
    data?: Array<UserDto>;
    meta?: PaginatedMetadata;
};

