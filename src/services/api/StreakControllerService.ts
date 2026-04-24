import { ApiResponseUserStreakResponse } from "@/types";
import axiosClient from "./axiosClient";

export class StreakControllerService {
    /**
     * @returns ApiResponseUserStreakResponse OK
     * @throws ApiError
     */
    public static getMyStreak(): Promise<ApiResponseUserStreakResponse> {
        return axiosClient.get('/api/v1/streaks/me');
    }
}
