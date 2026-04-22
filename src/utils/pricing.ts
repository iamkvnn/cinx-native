type PriceValue = number | string | null | undefined;

export type PricingInfo = {
  originalPrice: number;
  currentPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
};

const toAmount = (value: PriceValue): number => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const resolvePricing = (
  price: PriceValue,
  discountedPrice: PriceValue,
): PricingInfo => {
  const originalPrice = toAmount(price);
  const discounted = toAmount(discountedPrice);
  const hasDiscount = discounted > 0 && discounted < originalPrice;
  const currentPrice = hasDiscount ? discounted : originalPrice;

  return {
    originalPrice,
    currentPrice,
    discountAmount: hasDiscount ? originalPrice - discounted : 0,
    hasDiscount,
  };
};

export const formatPriceK = (value: PriceValue): string => {
  const numeric = toAmount(value);

  if (numeric <= 0) {
    return "Miễn phí";
  }

  const thousands = numeric / 1000;

  if (Number.isInteger(thousands)) {
    return `${Math.round(thousands).toLocaleString("vi-VN")}k`;
  }

  return `${Number(thousands.toFixed(1)).toLocaleString("vi-VN")}k`;
};

export const formatVnd = (value: PriceValue): string => {
  const numeric = toAmount(value);

  return `${numeric.toLocaleString("vi-VN")}đ`;
};
