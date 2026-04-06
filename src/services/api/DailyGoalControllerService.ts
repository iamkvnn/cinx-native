import { ApiResponseDailyGoalResponse, ApiResponseListDailyGoalResponse, SetDailyGoalRequest, ApiResponseVoid } from "@/types";
import axiosClient from "./axiosClient";

export class DailyGoalControllerService {
    /**
     * Get current user's daily goal for a specific date
     * @returns ApiResponseDailyGoalResponse OK
     * @throws ApiError
     */
    public static getDailyGoal({
        date,
    }: {
        date?: string,
    }): Promise<ApiResponseDailyGoalResponse> {
        return axiosClient.get('/api/v1/daily-goals',
            {
                params: {
                    'date': date,
                },
            }
        );
    }
    /**
     * Edit current user's daily goal target
     * @returns ApiResponseDailyGoalResponse OK
     * @throws ApiError
     */
    public static editDailyGoal({
        requestBody,
    }: {
        requestBody: SetDailyGoalRequest,
    }): Promise<ApiResponseDailyGoalResponse> {
        return axiosClient.put('/api/v1/daily-goals', requestBody);
    }
    /**
     * Set current user's daily goal target
     * @returns ApiResponseDailyGoalResponse OK
     * @throws ApiError
     */
    public static setDailyGoal({
        requestBody,
    }: {
        requestBody: SetDailyGoalRequest,
    }): Promise<ApiResponseDailyGoalResponse> {
        return axiosClient.post('/api/v1/daily-goals', requestBody);
    }
    /**
     * Delete current user's daily goal for a specific date
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static deleteDailyGoal({
        date,
    }: {
        date?: string,
    }): Promise<ApiResponseVoid> {
        return axiosClient.delete('/api/v1/daily-goals', {
            params: {
                'date': date,
            },
        });
    }
    /**
     * Get current user's daily goals for a specific month
     * @returns ApiResponseListDailyGoalResponse OK
     * @throws ApiError
     */
    public static getDailyGoalsInMonth({
        year,
        month,
    }: {
        year: number,
        month: number,
    }): Promise<ApiResponseListDailyGoalResponse> {
        return axiosClient.get('/api/v1/daily-goals/month', {
            params: {
                'year': year,
                'month': month,
            },
        });
    }
}
