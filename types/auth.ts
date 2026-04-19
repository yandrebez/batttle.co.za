export type UserRole = "ADMIN" | "USER";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export type OrderItem = {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId?: string;
  guestEmail?: string;
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
};
