export type DeliveryMethod = "HOME_DELIVERY" | "PUDO_PICKUP";

export const HOME_DELIVERY_SHIPPING_PRICE = 99;
export const PUDO_PICKUP_SHIPPING_PRICE = 60;

export function getShippingPrice(deliveryMethod: DeliveryMethod): number {
  return deliveryMethod === "PUDO_PICKUP"
    ? PUDO_PICKUP_SHIPPING_PRICE
    : HOME_DELIVERY_SHIPPING_PRICE;
}
