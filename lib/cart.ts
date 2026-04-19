import { CartItem } from "@/types/cart";

const CART_KEY = "battle_cart_items";

type CartProduct = Omit<CartItem, "quantity">;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getCartItems(): CartItem[] {
  if (!isBrowser()) {
    return [];
  }

  const rawItems = window.localStorage.getItem(CART_KEY);
  if (!rawItems) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawItems) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(product: CartProduct, size?: string): CartItem[] {
  const currentItems = getCartItems();
  const existing = currentItems.find(
    (item) => item.id === product.id && (item.size ?? "") === (size ?? ""),
  );

  const updatedItems = existing
    ? currentItems.map((item) =>
        item.id === product.id && (item.size ?? "") === (size ?? "")
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    : [...currentItems, { ...product, quantity: 1, size }];

  saveCartItems(updatedItems);
  return updatedItems;
}

export function removeFromCart(productId: number, size?: string): CartItem[] {
  const updatedItems = getCartItems().filter(
    (item) => !(item.id === productId && (item.size ?? "") === (size ?? "")),
  );
  saveCartItems(updatedItems);
  return updatedItems;
}
