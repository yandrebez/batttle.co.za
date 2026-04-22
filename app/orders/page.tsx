"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/lib/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useCurrencySymbol } from "@/components/CurrencyProvider";
import styles from "./page.module.css";

type OrderItem = {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  guestEmail: string | null;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  courierCompany: string | null;
  courierName: string | null;
  courierPhone: string | null;
  trackingCode: string | null;
  deliveryNotes: string | null;
  deliveryStatus: "UNASSIGNED" | "ASSIGNED" | "OUT_FOR_DELIVERY" | "DELIVERED";
  items: OrderItem[];
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const statusColors: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
};

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [guestEmail, setGuestEmail] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const currencySymbol = useCurrencySymbol();

  const parseJsonSafely = async <T,>(response: Response): Promise<T | { message?: string }> => {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return { message: "Unexpected server response." };
    }
  };

  const fetchOrders = async (userId: string, email?: string) => {
    setIsLoadingOrders(true);
    setOrderError("");
    try {
      const query = email
        ? `/api/orders?userId=${encodeURIComponent(userId)}&guestEmail=${encodeURIComponent(email)}`
        : `/api/orders?userId=${encodeURIComponent(userId)}`;
      const response = await fetch(query);
      const data = (await parseJsonSafely<{ orders: Order[]; message?: string }>(response)) as {
        orders?: Order[];
        message?: string;
      };
      if (!response.ok) {
        setOrderError(data.message || "Failed to load orders");
        return;
      }
      setOrders(data.orders || []);
    } catch (error) {
      setOrderError(String(error) || "Error loading orders");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchGuestOrders = async (email: string) => {
    setIsLoadingOrders(true);
    setOrderError("");
    try {
      const response = await fetch(`/api/orders?guestEmail=${encodeURIComponent(email)}`);
      const data = (await parseJsonSafely<{ orders: Order[]; message?: string }>(response)) as {
        orders?: Order[];
        message?: string;
      };
      if (!response.ok) {
        setOrderError(data.message || "Failed to load orders");
        return;
      }
      if (!data.orders || data.orders.length === 0) {
        setOrderError("No orders found for this email address");
        return;
      }
      setOrders(data.orders);
    } catch (error) {
      setOrderError(String(error) || "Error loading orders");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders(user.id, user.email);
    }
  }, [user, authLoading]);

  const handleGuestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (guestEmail.trim()) {
      fetchGuestOrders(guestEmail);
    }
  };

  if (authLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.loadingState}>
            <Spinner label="Checking account..." />
          </div>
        </section>
      </main>
    );
  }

  const hasOrders = orders.length > 0;

  if (!user) {
    return (
      <main className={styles.page}>
        <section className={styles.section}>
          <div className={styles.headingWrap}>
            <p className={styles.eyebrow}>Orders</p>
            <h1>Your Orders</h1>
            <p>Sign in to view your order history, or enter your email to look up guest orders.</p>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleGuestSubmit} className={styles.guestForm}>
              <label htmlFor="email">Guest Order Lookup</label>
              <input
                id="email"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
              <button type="submit" disabled={isLoadingOrders}>
                {isLoadingOrders ? "Searching..." : "Find Orders"}
              </button>
            </form>

            {orderError ? <p className={styles.error}>{orderError}</p> : null}

            {isLoadingOrders ? (
              <div className={styles.loadingState}>
                <Spinner label="Loading orders..." />
              </div>
            ) : hasOrders ? (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className={styles.orderCard}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className={styles.orderHeader}>
                      <div>
                        <h3>Order {order.id.slice(0, 8)}</h3>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <strong>{currencySymbol}{order.totalAmount.toFixed(2)}</strong>
                    </div>
                    <div className={styles.orderStatus}>
                      <span
                        className={styles.badge}
                        style={{ background: statusColors[order.status] }}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.signInPrompt}>
            <p>Want to sign up?</p>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className={styles.signUpBtn}
            >
              Create Account
            </button>
          </div>
        </section>

        {selectedOrder ? (
          <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Order Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close"
                >
                  X
                </button>
              </div>

              <div className={styles.orderDetails}>
                <div className={styles.detailRow}>
                  <span>Order ID</span>
                  <code>{selectedOrder.id}</code>
                </div>

                <div className={styles.detailRow}>
                  <span>Status</span>
                  <div
                    className={styles.badge}
                    style={{ background: statusColors[selectedOrder.status] }}
                  >
                    {statusLabels[selectedOrder.status]}
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <span>Delivery</span>
                  <p>{selectedOrder.deliveryStatus.replaceAll("_", " ")}</p>
                </div>

                {selectedOrder.courierCompany || selectedOrder.courierName || selectedOrder.trackingCode ? (
                  <div className={styles.detailRow}>
                    <span>Courier</span>
                    <div>
                      {selectedOrder.courierCompany ? <p>{selectedOrder.courierCompany}</p> : null}
                      {selectedOrder.courierName ? <p>{selectedOrder.courierName}</p> : null}
                      {selectedOrder.courierPhone ? <p>{selectedOrder.courierPhone}</p> : null}
                      {selectedOrder.trackingCode ? <p>Tracking: {selectedOrder.trackingCode}</p> : null}
                    </div>
                  </div>
                ) : null}

                {selectedOrder.deliveryNotes ? (
                  <div className={styles.detailRow}>
                    <span>Courier Notes</span>
                    <p>{selectedOrder.deliveryNotes}</p>
                  </div>
                ) : null}

                <div className={styles.detailRow}>
                  <span>Order Date</span>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>

                <div className={styles.detailRow}>
                  <span>Shipping To</span>
                  <div>
                    <p>{selectedOrder.fullName}</p>
                    <p>{selectedOrder.addressLine}</p>
                    <p>
                      {selectedOrder.city}, {selectedOrder.postalCode}
                    </p>
                  </div>
                </div>

                <h4>Items</h4>
                <div className={styles.itemsList}>
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <div>
                        <p>{item.name}</p>
                        <span>Qty: {item.quantity}</span>
                      </div>
                      <strong>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                <div className={styles.detailRow}>
                  <span>Total</span>
                  <strong>{currencySymbol}{selectedOrder.totalAmount.toFixed(2)}</strong>
                </div>

                <h4>Order Progress</h4>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width:
                        selectedOrder.status === "PENDING"
                          ? "25%"
                          : selectedOrder.status === "PROCESSING"
                            ? "50%"
                            : selectedOrder.status === "SHIPPED"
                              ? "75%"
                              : selectedOrder.status === "DELIVERED"
                                ? "100%"
                                : "0%",
                    }}
                  />
                </div>
                <div className={styles.progressLabels}>
                  <span>Pending</span>
                  <span>Processing</span>
                  <span>Shipped</span>
                  <span>Delivered</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    );
  }

  // Logged-in user view
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.headingWrap}>
          <p className={styles.eyebrow}>Orders</p>
          <h1>Your Orders</h1>
          <p>View your order history and tracking information.</p>
        </div>

        {isLoadingOrders ? (
          <div className={styles.loadingState}>
            <Spinner label="Loading orders..." />
          </div>
        ) : orderError ? (
          <p className={styles.error}>{orderError}</p>
        ) : hasOrders ? (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <article
                key={order.id}
                className={styles.orderCard}
                onClick={() => setSelectedOrder(order)}
              >
                <div className={styles.orderHeader}>
                  <div>
                    <h3>Order {order.id.slice(0, 8)}</h3>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <strong>{currencySymbol}{order.totalAmount.toFixed(2)}</strong>
                </div>
                <div className={styles.orderStatus}>
                  <span
                    className={styles.badge}
                    style={{ background: statusColors[order.status] }}
                  >
                    {statusLabels[order.status]}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>You have no orders yet.</p>
            <Link href="/shop">Start shopping</Link>
          </div>
        )}
      </section>

      {selectedOrder ? (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Order Details</h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
              >
                X
              </button>
            </div>

            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span>Order ID</span>
                <code>{selectedOrder.id}</code>
              </div>

              <div className={styles.detailRow}>
                <span>Status</span>
                <div
                  className={styles.badge}
                  style={{ background: statusColors[selectedOrder.status] }}
                >
                  {statusLabels[selectedOrder.status]}
                </div>
              </div>

              <div className={styles.detailRow}>
                <span>Order Date</span>
                <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>

              <div className={styles.detailRow}>
                <span>Shipping To</span>
                <div>
                  <p>{selectedOrder.fullName}</p>
                  <p>{selectedOrder.addressLine}</p>
                  <p>
                    {selectedOrder.city}, {selectedOrder.postalCode}
                  </p>
                </div>
              </div>

              <h4>Items</h4>
              <div className={styles.itemsList}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div>
                      <p>{item.name}</p>
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <strong>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.detailRow}>
                <span>Total</span>
                <strong>{currencySymbol}{selectedOrder.totalAmount.toFixed(2)}</strong>
              </div>

              <h4>Order Progress</h4>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width:
                      selectedOrder.status === "PENDING"
                        ? "25%"
                        : selectedOrder.status === "PROCESSING"
                          ? "50%"
                          : selectedOrder.status === "SHIPPED"
                            ? "75%"
                            : selectedOrder.status === "DELIVERED"
                              ? "100%"
                              : "0%",
                  }}
                />
              </div>
              <div className={styles.progressLabels}>
                <span>Pending</span>
                <span>Processing</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
