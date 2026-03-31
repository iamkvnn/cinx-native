import type { AxiosResponse } from "axios";

import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface CheckoutOrderResponseApi {
  id?: number;
  totalAmount?: number;
}

export interface OrderDetailItemApi {
  id?: number;
  finalPrice?: number;
  final_price?: number;
  unitPrice?: number;
  unit_price?: number;
  course?: {
    id?: number;
    title?: string;
    thumbnailUrl?: string;
    thumbnail_url?: string;
    instructor?: {
      fullName?: string;
      profile?: {
        fullName?: string;
      };
    };
  };
}

export interface OrderApi {
  id?: number;
  status?: string;
  totalAmount?: number;
  total_amount?: number;
  totalPrice?: number;
  total_price?: number;
  paymentMethod?: string;
  payment_method?: string;
  details?: OrderDetailItemApi[];
  orderItems?: OrderDetailItemApi[];
}

const unwrapData = <T>(response: AxiosResponse<T | ApiEnvelope<T>>): T => {
  const payload = response.data;

  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

export const checkoutOrder = async (): Promise<CheckoutOrderResponseApi> => {
  const response = await axiosClient.post<
    CheckoutOrderResponseApi | ApiEnvelope<CheckoutOrderResponseApi>
  >("/orders/checkout", {});

  return unwrapData(response);
};

export const getOrderById = async (orderId: number): Promise<OrderApi> => {
  const response = await axiosClient.get<OrderApi | ApiEnvelope<OrderApi>>(
    `/orders/${orderId}`,
  );

  return unwrapData(response);
};

export const confirmPayment = async (
  orderId: number,
  data?: { useRewardPoints: boolean },
): Promise<OrderApi> => {
  const response = await axiosClient.post<OrderApi | ApiEnvelope<OrderApi>>(
    `/orders/${orderId}/confirm-payment`,
    data ?? {},
  );

  return unwrapData(response);
};

export const fetchMyOrders = async (): Promise<OrderApi[]> => {
  const response = await axiosClient.get<OrderApi[] | ApiEnvelope<OrderApi[]>>(
    "/orders/my-orders",
  );

  return unwrapData(response);
};

export const cancelOrder = async (orderId: number): Promise<OrderApi> => {
  const response = await axiosClient.post<OrderApi | ApiEnvelope<OrderApi>>(
    `/orders/${orderId}/cancel`,
    {},
  );

  return unwrapData(response);
};
