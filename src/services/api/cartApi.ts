import axios, { type AxiosResponse } from "axios";

import axiosClient from "./axiosClient";

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export interface CartCourseApi {
  id: number;
  title?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  price?: number;
  instructor?: {
    fullName?: string;
    profile?: {
      fullName?: string;
    };
  };
}

export interface CartItemApi {
  id: number;
  quantity?: number;
  unitPrice?: number;
  unit_price?: number;
  course?: CartCourseApi;
}

export interface CartApi {
  id: number;
  items?: CartItemApi[];
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

export const fetchCart = async (): Promise<CartApi> => {
  try {
    const response = await axiosClient.get<CartApi | ApiEnvelope<CartApi>>(
      "/cart",
    );

    const cart = unwrapData(response);
    return {
      id: Number(cart?.id ?? 0),
      items: Array.isArray(cart?.items) ? cart.items : [],
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        id: 0,
        items: [],
      };
    }

    throw error;
  }
};

export const removeFromCart = async (
  courseId: number,
): Promise<{ message?: string }> => {
  const response = await axiosClient.delete<
    { message?: string } | ApiEnvelope<{ message?: string }>
  >(`/cart/${courseId}`);

  return unwrapData(response);
};
