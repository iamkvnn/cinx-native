import axiosClient from "./axiosClient";
import { ApiResponseLong, PaginatedApiResponseUserNotificationResponse, ApiResponseVoid } from "@/types";

export class NotificationControllerService {
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static toggleRead({
        notificationId,
    }: {
        notificationId: string,
    }): Promise<ApiResponseVoid> {
        return axiosClient.post(`/api/v1/notifications/${notificationId}/toggle-read`);
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
    }): Promise<ApiResponseVoid> {
        return axiosClient.post('/api/v1/notifications/test-push', {
            title,
            body,
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
    }): Promise<PaginatedApiResponseUserNotificationResponse> {
        return axiosClient.get('/api/v1/notifications', {
            params: {
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
    public static countUnreadNotifications(): Promise<ApiResponseLong> {
        return axiosClient.get('/api/v1/notifications/unread-count');
    }
    /**
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static deleteNotification({
        notificationId,
    }: {
        notificationId: string,
    }): Promise<ApiResponseVoid> {
        return axiosClient.delete(`/api/v1/notifications/${notificationId}`);
    }
}
