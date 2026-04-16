/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PaymentResponse = {
    id?: string;
    orderId?: string;
    amount?: number;
    status?: 'PROCESSING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
    paymentDate?: string;
    paymentInfo?: string;
    paymentMessage?: string;
};

