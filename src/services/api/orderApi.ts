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

const mapOrder = (order: OrderDetailResponse): OrderApi => {
  const paymentStatus = String(order.payment?.status ?? "").toUpperCase();
  const status =
    paymentStatus === "PAID"
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

  return {
    id: order.id,
    userId: order.userId,
    items: mapOrderItems(order.items),
    totalPrice: order.totalPrice,
    discounted: order.discounted,
    orderDate: order.orderDate,
    status: "PENDING",
    totalAmount: order.totalPrice,
    total_amount: order.totalPrice,
    orderItems: mapOrderItems(order.items),
    details: mapOrderItems(order.items),
    paymentMethod,
  } satisfies OrderApi;
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
  throw new Error("Backend mới hiện chưa có endpoint hủy đơn hàng.");
};

export type { OrderResponse };
