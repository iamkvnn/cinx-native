import { ApiResponseTokenResponseDto, AuthRequestDto, ChangeEmailRequest, ChangePasswordRequest, RefreshTokenRequest, RegisterRequest, ResetPasswordRequest, SendOtpRequest, VerifyEmailRequest, ApiResponseObject } from "@/types";
import axiosClient from "./axiosClient";

export class AuthControllerService {
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static verifyOtp({
        requestBody,
    }: {
        requestBody: VerifyEmailRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/verify-otp', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static resendOtp({
        requestBody,
    }: {
        requestBody: SendOtpRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/send-otp', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static sendChangePasswordOtp({
        requestBody,
    }: {
        requestBody: SendOtpRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/send-change-password-otp', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static sendChangeEmailOtp({
        requestBody,
    }: {
        requestBody: SendOtpRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/send-change-email-otp', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static resetPassword({
        requestBody,
    }: {
        requestBody: ResetPasswordRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/reset-password', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static register({
        requestBody,
    }: {
        requestBody: RegisterRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/register', requestBody);
    }
    /**
     * @returns ApiResponseTokenResponseDto OK
     * @throws ApiError
     */
    public static refreshToken({
        requestBody,
    }: {
        requestBody: RefreshTokenRequest,
    }): Promise<ApiResponseTokenResponseDto> {
        return axiosClient.post('/api/v1/auth/refresh-token', requestBody);
    }
    /**
     * @returns ApiResponseTokenResponseDto OK
     * @throws ApiError
     */
    public static login({
        requestBody,
    }: {
        requestBody: AuthRequestDto,
    }): Promise<ApiResponseTokenResponseDto> {
        return axiosClient.post('/api/v1/auth/login', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static changePassword({
        requestBody,
    }: {
        requestBody: ChangePasswordRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/change-password', requestBody);
    }
    /**
     * @returns ApiResponseObject OK
     * @throws ApiError
     */
    public static changeEmail({
        requestBody,
    }: {
        requestBody: ChangeEmailRequest,
    }): Promise<ApiResponseObject> {
        return axiosClient.post('/api/v1/auth/change-email', requestBody);
    }
}
