/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseLong } from '../models/ApiResponseLong';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { PaginatedApiResponseUserNotificationResponse } from '../models/PaginatedApiResponseUserNotificationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationControllerService {
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static toggleRead({
        notificationId,
    }: {
        notificationId: string,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/{notificationId}/toggle-read',
            path: {
                'notificationId': notificationId,
            },
        });
    }
    /**
     * Test Push Notification
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static testPushNotification({
        title,
        body,
    }: {
        title: string,
        body: string,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notifications/test-push',
            query: {
                'title': title,
                'body': body,
            },
        });
    }
    /**
     * @returns PaginatedApiResponseUserNotificationResponse OK
     * @throws ApiError
     */
    public static getNotifications({
        page = 1,
        size = 10,
        query,
        sort,
    }: {
        page?: number,
        size?: number,
        query?: string,
        sort?: string,
    }): CancelablePromise<PaginatedApiResponseUserNotificationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications',
            query: {
                'page': page,
                'size': size,
                'query': query,
                'sort': sort,
            },
        });
    }
    /**
     * @returns ApiResponseLong OK
     * @throws ApiError
     */
    public static countUnreadNotifications(): CancelablePromise<ApiResponseLong> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notifications/unread-count',
        });
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static deleteNotification({
        notificationId,
    }: {
        notificationId: string,
    }): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/notifications/{notificationId}',
            path: {
                'notificationId': notificationId,
            },
        });
    }
}
