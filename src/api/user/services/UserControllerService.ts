/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseBoolean } from '../models/ApiResponseBoolean';
import type { ApiResponseListString } from '../models/ApiResponseListString';
import type { ApiResponseListUserDto } from '../models/ApiResponseListUserDto';
import type { ApiResponseObject } from '../models/ApiResponseObject';
import type { ApiResponseUserDto } from '../models/ApiResponseUserDto';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { CreateUserRequest } from '../models/CreateUserRequest';
import type { DeviceTokenRequest } from '../models/DeviceTokenRequest';
import type { PaginatedApiResponseUserDto } from '../models/PaginatedApiResponseUserDto';
import type { UpdateProfileRequest } from '../models/UpdateProfileRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserControllerService {
    /**
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static getUserById({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static updateUser({
        id,
        formData,
    }: {
        id: string,
        formData?: {
            user: UpdateProfileRequest;
            avatar?: Blob;
        },
    }): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{id}',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @returns PaginatedApiResponseUserDto OK
     * @throws ApiError
     */
    public static getAllUsers({
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users',
            query: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static createUser({
        requestBody,
    }: {
        requestBody: CreateUserRequest,
    }): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Add XP to user profile (internal)
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static addXp({
        userId,
        amount,
    }: {
        userId: string,
        amount: number,
    }): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{userId}/add-xp',
            path: {
                'userId': userId,
            },
            query: {
                'amount': amount,
            },
        });
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static verifyInstructor({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseObject> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{id}/verify-instructor',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Save user FCM device token
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static saveDeviceToken({
        requestBody,
    }: {
        requestBody: DeviceTokenRequest,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/device-tokens',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get user FCM device tokens (internal)
     * @returns ApiResponseListString OK
     * @throws ApiError
     */
    public static getUserTokens({
        userId,
    }: {
        userId: string,
    }): CancelablePromise<ApiResponseListString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{userId}/fcm-tokens',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @returns ApiResponseBoolean OK
     * @throws ApiError
     */
    public static checkInstructorVerified({
        id,
    }: {
        id: string,
    }): CancelablePromise<ApiResponseBoolean> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{id}/instructor-verified',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ApiResponseUserDto OK
     * @throws ApiError
     */
    public static getCurrentUser(): CancelablePromise<ApiResponseUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me',
        });
    }
    /**
     * @returns ApiResponseListUserDto OK
     * @throws ApiError
     */
    public static getUsersByIds({
        ids,
    }: {
        ids: Array<string>,
    }): CancelablePromise<ApiResponseListUserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/ids',
            query: {
                'ids': ids,
            },
        });
    }
    /**
     * @returns binary OK
     * @throws ApiError
     */
    public static getAvatarImage({
        fileName,
    }: {
        fileName: string,
    }): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/avatars/{fileName}',
            path: {
                'fileName': fileName,
            },
        });
    }
}
