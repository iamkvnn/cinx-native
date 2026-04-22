import type {
  CourseResponse,
  CreateOrderRequest,
  OrderDetailResponse,
  OrderItemResponse,
  OrderResponse,
  PaymentResponse,
  CartItemDto,
} from "@/types";

import axiosClient from "./axiosClient";
import { CartControllerService } from "./CartControllerService";
import { CourseControllerService } from "./CourseControllerService";
import { OrderControllerService } from "./OrderControllerService";
import axios from "axios";

export type OrderDetailItemApi = (OrderItemResponse & {
  course?: (CourseResponse & Record<string, any>) | null;
  finalPrice?: number;
  final_price?: number;
  unitPrice?: number;
  unit_price?: number;
}) &
  Record<string, any>;

export type OrderApi = (OrderDetailResponse & {
  status?: string;
  totalAmount?: number;
  total_amount?: number;
  paymentMethod?: "VN_PAY" | "MOMO";
  details?: OrderDetailItemApi[];
  orderItems?: OrderDetailItemApi[];
  payment?: PaymentResponse | null;
}) &
  Record<string, any>;

export type ConfirmPaymentResult = {
  order: OrderApi;
  isPaid: boolean;
  paymentUrl?: string;
};

const mapOrderItems = (
  items: OrderItemResponse[] | undefined,
): OrderDetailItemApi[] => {
  return (items ?? []).map((item) => ({
    ...item,
    finalPrice: item.discountedPrice ?? item.price,
    final_price: item.discountedPrice ?? item.price,
    unitPrice: item.price,
    unit_price: item.price,
    course: {
      id: item.courseId,
      title: item.title,
      price: item.price,
      discountedPrice: item.discountedPrice,
      images: [],
    },
  }));
};

const mapCreatedOrder = (
  order: OrderResponse,
  paymentMethod: "VN_PAY" | "MOMO",
): OrderApi => {
  const mappedItems = mapOrderItems(order.items);

  return {
    id: order.id,
    userId: order.userId,
    items: mappedItems,
    totalPrice: order.totalPrice,
    discounted: order.discounted,
    orderDate: order.orderDate,
    status: "PENDING",
    totalAmount: order.totalPrice,
    total_amount: order.totalPrice,
    orderItems: mappedItems,
    details: mappedItems,
    paymentMethod,
  } satisfies OrderApi;
};

const mapOrder = (order: OrderDetailResponse): OrderApi => {
  const backendStatus = String(
    (order as OrderDetailResponse & Record<string, unknown>).status ?? "",
  ).toUpperCase();
  const paymentStatus = String(order.payment?.status ?? "").toUpperCase();
  const status =
    backendStatus === "CANCELLED"
      ? "CANCELLED"
      : paymentStatus === "PAID"
      ? "COMPLETED"
      : paymentStatus === "PROCESSING"
        ? "PENDING"
        : paymentStatus === "REFUNDED"
          ? "CANCELLED"
          : "PENDING";

  const items = mapOrderItems(order.items);

  return {
    ...(order as OrderDetailResponse & Record<string, any>),
    status,
    totalAmount: order.totalPrice,
    total_amount: order.totalPrice,
    details: items,
    orderItems: items,
  };
};

export const fetchMyOrders = async (): Promise<OrderApi[]> => {
  const response = await OrderControllerService.getOrders({
    page: 1,
    size: 50,
  });

  return (response.data ?? []).map(mapOrder);
};

export const getOrderById = async (
  orderId: string | number,
): Promise<OrderApi> => {
  const response = await OrderControllerService.getOrderById({
    orderId: String(orderId),
  });

  const order = response.data;

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng.");
  }

  return mapOrder(order);
};

export const checkoutOrder = async ({
  courseId,
  paymentMethod = "MOMO",
  voucherCode,
}: {
  courseId?: string | number;
  paymentMethod?: "VN_PAY" | "MOMO";
  voucherCode?: string;
} = {}): Promise<OrderApi> => {
  let cartItems: CartItemDto[] = [];

  if (courseId) {
    const courseResponse = await CourseControllerService.getCourseById({
      id: String(courseId),
    });

    const course = courseResponse.data;

    if (!course) {
      throw new Error("Không thể tải khóa học để thanh toán.");
    }

    cartItems = [
      {
        id: String(course.id ?? courseId),
        course: course as CourseResponse,
      },
    ];
  } else {
    const cartResponse = await CartControllerService.getCart();

    cartItems = (cartResponse.data ?? []).map((item) => ({
      id: String(item.id ?? ""),
      course: item.course as CourseResponse,
    }));
  }

  const response = await OrderControllerService.createOrder({
    requestBody: {
      cartItems,
      paymentMethod,
      voucherCode,
    } satisfies CreateOrderRequest,
  });

  const order = response.data;

  if (!order) {
    throw new Error("Không thể tạo đơn hàng.");
  }

  return mapCreatedOrder(order, paymentMethod);
};

const buildCartItemsFromOrder = (order: OrderApi): CartItemDto[] => {
  const sourceItems = (order.details ?? order.orderItems ?? order.items ?? []) as
    OrderDetailItemApi[];
  const cartItems: CartItemDto[] = [];

  sourceItems.forEach((item) => {
    const courseId = String(item.courseId ?? item.course?.id ?? "").trim();

    if (!courseId) {
      return;
    }

    const title = String(item.title ?? item.course?.title ?? "Khóa học");
    const price = Number(item.price ?? item.unitPrice ?? 0);
    const discountedPrice = Number(
      item.discountedPrice ?? item.finalPrice ?? item.unitPrice ?? price,
    );

    cartItems.push({
      id: String(item.id ?? courseId),
      course: {
        ...(item.course as CourseResponse | undefined),
        id: courseId,
        title,
        price,
        discountedPrice,
      } as CourseResponse,
    });
  });

  return cartItems;
};

export const recreateOrderWithVoucher = async ({
  orderId,
  voucherCode,
  paymentMethod,
}: {
  orderId: string;
  voucherCode?: string;
  paymentMethod?: "VN_PAY" | "MOMO";
}): Promise<OrderApi> => {
  const existingOrder = await getOrderById(orderId);
  const existingStatus = String(existingOrder.status ?? "").toUpperCase();

  if (existingStatus !== "PENDING") {
    throw new Error("Chỉ có thể cập nhật voucher cho đơn hàng đang chờ.");
  }

  const cartItems = buildCartItemsFromOrder(existingOrder);

  if (cartItems.length === 0) {
    throw new Error("Không có khóa học hợp lệ để tạo lại đơn hàng.");
  }

  const resolvedPaymentMethod =
    paymentMethod ?? existingOrder.paymentMethod ?? "MOMO";

  const createdResponse = await OrderControllerService.createOrder({
    requestBody: {
      cartItems,
      paymentMethod: resolvedPaymentMethod,
      voucherCode: voucherCode?.trim() || undefined,
    } satisfies CreateOrderRequest,
  });

  const createdOrder = createdResponse.data;

  if (!createdOrder?.id) {
    throw new Error("Không thể tạo lại đơn hàng với voucher.");
  }

  try {
    await axiosClient.put(`/api/v1/orders/${orderId}/cancel`);
  } catch {
    // Ignore cancellation failure so user can continue with newly created order.
  }

  return mapCreatedOrder(createdOrder, resolvedPaymentMethod);
};

export const confirmPayment = async (
  orderId: string | number,
  options?: { useRewardPoints?: boolean; paymentMethod?: "VN_PAY" | "MOMO" },
): Promise<ConfirmPaymentResult> => {
  const order = await getOrderById(orderId);

  const paymentStatus = String(order.payment?.status ?? "").toUpperCase();

  if (paymentStatus === "PAID") {
    return {
      order,
      isPaid: true,
    };
  }

  const paymentMethod = options?.paymentMethod ?? order.paymentMethod ?? "MOMO";
  const orderIdString = String(orderId);

  try {
    const paymentResponse = await axiosClient.get("/api/v1/payments", {
      params: {
        orderId: orderIdString,
        paymentMethod,
      },
    });

    const payment = paymentResponse?.data as PaymentResponse | undefined;

    if (String(payment?.status ?? "").toUpperCase() === "PAID") {
      const paidOrder = await getOrderById(orderIdString);
      return {
        order: paidOrder,
        isPaid: true,
      };
    }
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const message = String(
      (error.response?.data as { message?: string } | undefined)?.message ?? "",
    ).toLowerCase();
    const status = Number(error.response?.status ?? 0);
    const isPaymentMissing =
      status === 404 ||
      message.includes("payment not found") ||
      message.includes("not found for orderid");

    if (!isPaymentMissing) {
      throw error;
    }
  }

  const createPaymentResponse = await axiosClient.post("/api/v1/payments", {
    orderId: orderIdString,
    paymentMethod,
  });

  const paymentUrl =
    typeof createPaymentResponse?.data === "string"
      ? createPaymentResponse.data
      : undefined;

  return {
    order,
    isPaid: false,
    paymentUrl,
  };
};

export const checkPaymentPaid = async (
  orderId: string | number,
  paymentMethod: "VN_PAY" | "MOMO" = "MOMO",
): Promise<boolean> => {
  const orderIdString = String(orderId);
  const order = await getOrderById(orderIdString);
  const orderPaymentStatus = String(order.payment?.status ?? "").toUpperCase();

  if (orderPaymentStatus === "PAID") {
    return true;
  }

  try {
    const paymentResponse = await axiosClient.get("/api/v1/payments", {
      params: {
        orderId: orderIdString,
        paymentMethod,
      },
    });

    const payment = paymentResponse?.data as PaymentResponse | undefined;
    return String(payment?.status ?? "").toUpperCase() === "PAID";
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const message = String(
      (error.response?.data as { message?: string } | undefined)?.message ?? "",
    ).toLowerCase();
    const status = Number(error.response?.status ?? 0);
    const isPaymentMissing =
      status === 404 ||
      message.includes("payment not found") ||
      message.includes("not found for orderid");

    if (isPaymentMissing) {
      return false;
    }

    throw error;
  }
};

export const cancelOrder = async (_orderId: string | number): Promise<void> => {
  await axiosClient.put(`/api/v1/orders/${String(_orderId)}/cancel`);
};

export type { OrderResponse };
