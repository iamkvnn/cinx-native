/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemResponse } from './OrderItemResponse';
export type OrderResponse = {
    id?: string;
    userId?: string;
    items?: Array<OrderItemResponse>;
    totalPrice?: number;
    discounted?: number;
    orderDate?: string;
    status?: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
    paymentMethod?: 'VN_PAY' | 'MOMO';
};

