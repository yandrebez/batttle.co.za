"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCartItems, removeFromCart } from "@/lib/cart";
import { useAuth } from "@/lib/useAuth";
import { CartItem } from "@/types/cart";
import { AuthModal } from "@/components/AuthModal";
import { useCurrencySymbol } from "@/components/CurrencyProvider";
import styles from "./page.module.css";

type ShippingForm = {
  deliveryMethod: "HOME_DELIVERY" | "PUDO_PICKUP";
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  pudoLocation: string;
  guestEmail?: string;
};

const initialShippingForm: ShippingForm = {
  deliveryMethod: "HOME_DELIVERY",
  fullName: "",
  addressLine: "",
  city: "",
  postalCode: "",
  pudoLocation: "",
};

export default function CartPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingForm>(initialShippingForm);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const currencySymbol = useCurrencySymbol();

  useEffect(() => {
    setItems(getCartItems());
  }, []);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const discountAmount = useMemo(
    () => parseFloat((totalAmount * (discountPercent / 100)).toFixed(2)),
    [totalAmount, discountPercent],
  );

  const finalAmount = useMemo(
    () => parseFloat((totalAmount - discountAmount).toFixed(2)),
    [totalAmount, discountAmount],
  );

  const handleApplyDiscount = async () => {
    const code = discountCodeInput.trim();
    if (!code) return;
    setDiscountError("");
    setIsValidatingCode(true);
    try {
      const res = await fetch(`/api/discount/validate?code=${encodeURIComponent(code)}`);
      const data = (await res.json()) as { valid: boolean; discountPercent: number };
      if (data.valid) {
        setAppliedCode(code.toUpperCase());
        setDiscountPercent(data.discountPercent);
      } else {
        setAppliedCode(null);
        setDiscountPercent(0);
        setDiscountError("Invalid discount code.");
      }
    } catch {
      setDiscountError("Could not validate the code. Please try again.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedCode(null);
    setDiscountPercent(0);
    setDiscountCodeInput("");
    setDiscountError("");
  };

  const handleRemoveItem = (productId: number, size?: string) => {
    const updated = removeFromCart(productId, size);
    setItems(updated);
  };

  const openPayModal = () => {
    if (items.length === 0) {
      return;
    }

    setPaymentMessage("");
    setOrderError("");
    setIsPayModalOpen(true);
  };

  const closePayModal = () => {
    setIsPayModalOpen(false);
  };

  const handleShippingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payfast/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          guestEmail: user?.email || shipping.guestEmail,
          deliveryMethod: shipping.deliveryMethod,
          pudoLocation: shipping.deliveryMethod === "PUDO_PICKUP" ? shipping.pudoLocation : undefined,
          fullName: shipping.fullName,
          addressLine: shipping.addressLine,
          city: shipping.city,
          postalCode: shipping.postalCode,
          discountCode: appliedCode ?? undefined,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
          })),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        orderId?: string;
        payfastUrl?: string;
        fields?: Record<string, string>;
      };

      if (!response.ok) {
        setOrderError(data.message || "Order creation failed");
        setIsSubmitting(false);
        return;
      }

      // Clear cart before redirecting
      localStorage.removeItem("battle_cart_items");
      setItems([]);
      setShipping(initialShippingForm);

      // Build a hidden form and submit it to PayFast
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.payfastUrl ?? "";

      Object.entries(data.fields ?? {}).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setOrderError(String(error) || "Unexpected error");
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.cartSection}>
        <div className={styles.headingWrap}>
          <p className={styles.eyebrow}>Cart</p>
          <h1>Your Cart</h1>
          <p>Review your products, remove items, and continue to payment.</p>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Your cart is empty right now.</p>
            <Link href="/shop">Go back to shop</Link>
          </div>
        ) : (
          <div className={styles.itemList}>
            {items.map((item) => (
              <article key={`${item.id}-${item.size ?? ""}`} className={styles.itemRow}>
                <div className={styles.itemLeft}>
                  <div className={styles.imageWrap}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={90}
                      height={90}
                      unoptimized={item.image.startsWith("data:")}
                      className={styles.productImage}
                    />
                  </div>

                  <div className={styles.itemText}>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    {item.size ? <span className={styles.sizeTag}>Size: {item.size}</span> : null}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>

                <div className={styles.itemRight}>
                  <strong>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</strong>
                  <button type="button" onClick={() => handleRemoveItem(item.id, item.size)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className={styles.summary}>
        <h2>Summary</h2>

        {user ? (
          <div className={styles.userInfo}>
            <span>Signed in as</span>
            <p>{user.email}</p>
          </div>
        ) : null}

        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
        </div>

        <div className={styles.discountRow}>
          <input
            className={styles.discountInput}
            type="text"
            placeholder="Discount code"
            value={discountCodeInput}
            onChange={(e) => setDiscountCodeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleApplyDiscount(); } }}
            disabled={!!appliedCode}
          />
          {appliedCode ? (
            <button type="button" className={styles.discountRemove} onClick={handleRemoveDiscount}>
              Remove
            </button>
          ) : (
            <button
              type="button"
              className={styles.discountApply}
              onClick={() => void handleApplyDiscount()}
              disabled={isValidatingCode || !discountCodeInput.trim()}
            >
              {isValidatingCode ? "..." : "Apply"}
            </button>
          )}
        </div>

        {discountError ? <p className={styles.discountError}>{discountError}</p> : null}

        {appliedCode ? (
          <div className={styles.discountApplied}>
            <span>{appliedCode} — {discountPercent}% off</span>
            <span>−{currencySymbol}{discountAmount.toFixed(2)}</span>
          </div>
        ) : null}

        <div className={styles.summaryRow}>
          <span>Total to pay</span>
          <strong>{currencySymbol}{finalAmount.toFixed(2)}</strong>
        </div>

        <button
          type="button"
          onClick={openPayModal}
          className={styles.payButton}
          disabled={items.length === 0}
        >
          Pay
        </button>

        <nav className={styles.links}>
          <Link href="/shop">Back to Shop</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/orders">Orders</Link>
        </nav>

        {paymentMessage ? <p className={styles.paymentMessage}>{paymentMessage}</p> : null}
      </aside>

      {isPayModalOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Checkout</h3>
              <button type="button" onClick={closePayModal} aria-label="Close">
                X
              </button>
            </div>

            {!user ? (
              <div className={styles.authPrompt}>
                <p>Sign in to your account to proceed, or continue as guest.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPayModalOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className={styles.signInBtn}
                >
                  Sign In / Sign Up
                </button>
                <span>or</span>
              </div>
            ) : null}

            <form className={styles.form} onSubmit={handleShippingSubmit}>
              <label htmlFor="deliveryMethod">Delivery Method</label>
              <select
                id="deliveryMethod"
                className={styles.select}
                value={shipping.deliveryMethod}
                onChange={(event) =>
                  setShipping((prev) => ({
                    ...prev,
                    deliveryMethod: event.target.value as "HOME_DELIVERY" | "PUDO_PICKUP",
                  }))
                }
              >
                <option value="HOME_DELIVERY">Home Delivery</option>
                <option value="PUDO_PICKUP">PUDO Pickup Point</option>
              </select>

              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                value={shipping.fullName}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, fullName: event.target.value }))
                }
                required
              />

              {!user ? (
                <>
                  <label htmlFor="guestEmail">Email (order details will be sent here)</label>
                  <input
                    id="guestEmail"
                    type="email"
                    value={shipping.guestEmail || ""}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, guestEmail: event.target.value }))
                    }
                    required
                  />
                </>
              ) : null}

              {shipping.deliveryMethod === "HOME_DELIVERY" ? (
                <>
                  <label htmlFor="addressLine">Address Line</label>
                  <input
                    id="addressLine"
                    value={shipping.addressLine}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, addressLine: event.target.value }))
                    }
                    required
                  />
                </>
              ) : (
                <>
                  <label htmlFor="pudoLocation">PUDO Pickup Point / Locker Code</label>
                  <input
                    id="pudoLocation"
                    value={shipping.pudoLocation}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, pudoLocation: event.target.value }))
                    }
                    placeholder="Enter pickup point name or locker code"
                    required
                  />
                </>
              )}

              <label htmlFor="city">City</label>
              <input
                id="city"
                value={shipping.city}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, city: event.target.value }))
                }
                required
              />

              <label htmlFor="postalCode">Postal Code</label>
              <input
                id="postalCode"
                value={shipping.postalCode}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, postalCode: event.target.value }))
                }
                required
              />

              {orderError ? <p className={styles.error}>{orderError}</p> : null}

              <button
                type="submit"
                className={styles.submitShipping}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Redirecting to PayFast..." : "Confirm & Pay with PayFast"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}
