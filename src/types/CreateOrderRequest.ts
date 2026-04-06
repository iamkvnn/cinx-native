/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CartItemDto } from './CartItemDto';
export type CreateOrderRequest = {
    cartItems?: Array<CartItemDto>;
    paymentMethod?: 'VN_PAY' | 'MOMO';
    voucherCode?: string;
};

