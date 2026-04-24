import type { CartItemResponse, CourseResponse } from "@/types";

import { CartControllerService } from "./CartControllerService";

export type CartItemApi = CartItemResponse & {
  unitPrice?: number;
  unit_price?: number;
  quantity?: number;
  course?: (CourseResponse & Record<string, any>) | null;
} & Record<string, any>;

export type CartApi = {
  items?: CartItemApi[];
} & Record<string, any>;

const mapCartItem = (
  item: CartItemResponse | null | undefined,
): CartItemApi => {
  return {
    ...(item ?? {}),
    course: (item?.course ?? null) as CartItemApi["course"],
  };
};

export const fetchCart = async (): Promise<CartApi> => {
  const response = await CartControllerService.getCart();
  return {
    items: (response.data ?? []).map(mapCartItem),
  };
};

export const addCourseToCart = async (
  courseId: string | number,
): Promise<void> => {
  await CartControllerService.addToCart({
    requestBody: { courseId: String(courseId) },
  });
};

export const removeFromCart = async (
  itemId: string | number,
): Promise<void> => {
  await CartControllerService.removeFromCart({ itemId: String(itemId) });
};

export const clearCart = async (): Promise<void> => {
  await CartControllerService.clearCart();
};
