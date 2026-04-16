/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrderItemResponse } from './OrderItemResponse';
import type { PaymentResponse } from './PaymentResponse';
import type { VoucherResponse } from './VoucherResponse';
export type OrderDetailResponse = {
    id?: string;
    userId?: string;
    items?: Array<OrderItemResponse>;
    totalPrice?: number;
    discounted?: number;
    orderDate?: string;
    status?: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
    paymentMethod?: 'VN_PAY' | 'MOMO';
    payment?: PaymentResponse;
    voucher?: VoucherResponse;
};

